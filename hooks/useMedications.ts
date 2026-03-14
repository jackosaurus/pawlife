import { useState, useCallback, useEffect } from 'react';
import { healthService } from '@/services/healthService';
import { Medication } from '@/types';
import { isRecurringFrequency, getDosesPerDay } from '@/constants/frequencies';

export type MedicationWithDoseInfo = Medication & {
  isRecurring: boolean;
  lastGivenDate: string | null;
  todayDoseCount: number;
  dosesPerDay: number | null;
};

export function useMedications(petId: string) {
  const [medications, setMedications] = useState<MedicationWithDoseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMedications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await healthService.getMedications(petId);

      // Identify recurring meds and fetch their latest doses + today's counts
      const recurringIds = data
        .filter((m) => isRecurringFrequency(m.frequency))
        .map((m) => m.id);

      const [latestDoses, todayCounts] =
        recurringIds.length > 0
          ? await Promise.all([
              healthService.getLatestDoseForMedications(recurringIds),
              healthService.getTodayDoseCounts(recurringIds),
            ])
          : [{}, {}];

      const enriched: MedicationWithDoseInfo[] = data.map((m) => ({
        ...m,
        isRecurring: isRecurringFrequency(m.frequency),
        lastGivenDate: latestDoses[m.id] ?? null,
        todayDoseCount: todayCounts[m.id] ?? 0,
        dosesPerDay: getDosesPerDay(m.frequency),
      }));

      setMedications(enriched);
    } catch {
      setError('Failed to load medications');
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  const currentMedications = medications.filter((m) => {
    if (!m.end_date) return true;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const [y, mo, d] = m.end_date.split('-').map(Number);
    const end = new Date(y, mo - 1, d);
    end.setHours(0, 0, 0, 0);
    return end.getTime() >= now.getTime();
  });

  return { medications, currentMedications, loading, error, refresh: loadMedications };
}
