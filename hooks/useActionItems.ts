import { useState, useCallback, useEffect, useRef } from 'react';
import { healthService } from '@/services/healthService';
import { Pet, ActionItem } from '@/types';
import { getRecurringMedicationStatus } from '@/utils/status';
import { getDosesPerDay, isRecurringFrequency } from '@/constants/frequencies';

function getUrgencyRank(urgency: string): number {
  if (urgency === 'overdue') return 0;
  if (urgency === 'due_today') return 1;
  return 2; // upcoming
}

function getTypeRank(type: string): number {
  return type === 'medication' ? 0 : 1;
}

function daysBetween(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function useActionItems(pets: Pet[]) {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref to the latest pets array so the callback always reads fresh data
  const petsRef = useRef(pets);
  petsRef.current = pets;

  // Stable serialized key — only changes when pet IDs actually change
  const petIdsKey = JSON.stringify(pets.map((p) => p.id));

  const loadActionItems = useCallback(async () => {
    const currentPets = petsRef.current;
    const petIds = currentPets.map((p) => p.id);
    if (petIds.length === 0) {
      setActionItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const petNameMap = new Map(currentPets.map((p) => [p.id, p.name]));

      // Fetch active medications and actionable vaccinations in parallel
      const [activeMeds, actionableVax] = await Promise.all([
        healthService.getActiveMedicationsForPets(petIds),
        healthService.getActionableVaccinations(petIds, 14),
      ]);

      // Fetch dose info for medications.
      // Defense-in-depth: also filter archived meds client-side. The service
      // already excludes them server-side, but a stale cached response or a
      // future regression in the service-layer filter could leak them into
      // dashboard "Needs Attention". Belt-and-suspenders for v1 bug #6.
      const recurringMeds = activeMeds.filter(
        (m) => isRecurringFrequency(m.frequency) && m.is_archived !== true,
      );
      const medIds = recurringMeds.map((m) => m.id);

      const [todayCounts, latestDoses] =
        medIds.length > 0
          ? await Promise.all([
              healthService.getTodayDoseCounts(medIds),
              healthService.getLatestDoseForMedications(medIds),
            ])
          : [{} as Record<string, number>, {} as Record<string, string>];

      // Build medication action items (only non-green statuses)
      const medItems: ActionItem[] = [];
      for (const med of recurringMeds) {
        const dosesPerDay = getDosesPerDay(med.frequency);
        const todayCount = todayCounts[med.id] ?? 0;
        const lastGiven = latestDoses[med.id] ?? null;

        const status = getRecurringMedicationStatus(
          lastGiven,
          med.frequency!,
          todayCount,
          dosesPerDay,
        );

        if (status === 'green') continue;

        const isOverdue = status === 'overdue';
        const isMultiDaily = dosesPerDay != null && dosesPerDay > 1;

        let subtitle: string;
        if (isMultiDaily) {
          if (isOverdue && todayCount === 0) {
            subtitle = 'Overdue \u2014 no doses today';
          } else {
            const remaining = dosesPerDay! - todayCount;
            subtitle = `${remaining} dose${remaining !== 1 ? 's' : ''} remaining today`;
          }
        } else {
          subtitle = isOverdue ? 'Overdue' : 'Due today';
        }

        medItems.push({
          id: `med-${med.id}`,
          type: 'medication',
          urgency: isOverdue ? 'overdue' : 'due_today',
          petId: med.pet_id,
          petName: petNameMap.get(med.pet_id) ?? '',
          title: med.name,
          subtitle,
          recordId: med.id,
          medicationId: med.id,
        });
      }

      // Build vaccination action items
      const vaxItems: ActionItem[] = actionableVax.map((vax) => {
        const diff = daysBetween(vax.next_due_date!);
        const isOverdue = diff < 0;
        const absDays = Math.abs(diff);

        let subtitle: string;
        if (isOverdue) {
          subtitle = `Overdue by ${absDays} day${absDays !== 1 ? 's' : ''}`;
        } else if (diff === 0) {
          subtitle = 'Due today';
        } else {
          subtitle = `Due in ${absDays} day${absDays !== 1 ? 's' : ''}`;
        }

        return {
          id: `vax-${vax.id}`,
          type: 'vaccination' as const,
          urgency: isOverdue ? 'overdue' as const : 'upcoming' as const,
          petId: vax.pet_id,
          petName: petNameMap.get(vax.pet_id) ?? '',
          title: vax.vaccine_name,
          subtitle,
          recordId: vax.id,
          vaccinationId: vax.id,
          intervalMonths: vax.interval_months ?? 12,
        };
      });

      // Combine and sort: urgency tier > type (meds first) > pet name
      const allItems = [...medItems, ...vaxItems].sort((a, b) => {
        const urgencyDiff = getUrgencyRank(a.urgency) - getUrgencyRank(b.urgency);
        if (urgencyDiff !== 0) return urgencyDiff;
        const typeDiff = getTypeRank(a.type) - getTypeRank(b.type);
        if (typeDiff !== 0) return typeDiff;
        return a.petName.localeCompare(b.petName);
      });

      setActionItems(allItems);
    } catch {
      setError('Failed to load action items');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petIdsKey]);

  useEffect(() => {
    loadActionItems();
  }, [loadActionItems]);

  return { actionItems, loading, error, refresh: loadActionItems };
}
