interface VaccineInfo {
  name: string;
  petType: 'dog' | 'cat';
  intervalMonths: number;
}

const VACCINES: VaccineInfo[] = [
  // Dog vaccines
  { name: 'Rabies', petType: 'dog', intervalMonths: 12 },
  { name: 'DHPP / Distemper', petType: 'dog', intervalMonths: 12 },
  { name: 'Bordetella', petType: 'dog', intervalMonths: 6 },
  { name: 'Leptospirosis', petType: 'dog', intervalMonths: 12 },
  { name: 'Canine Influenza', petType: 'dog', intervalMonths: 12 },
  { name: 'Lyme Disease', petType: 'dog', intervalMonths: 12 },

  // Cat vaccines
  { name: 'Rabies', petType: 'cat', intervalMonths: 12 },
  { name: 'FVRCP', petType: 'cat', intervalMonths: 12 },
  { name: 'FeLV', petType: 'cat', intervalMonths: 12 },
  { name: 'FIV', petType: 'cat', intervalMonths: 12 },
];

export function getVaccinesForType(petType: 'dog' | 'cat'): string[] {
  return VACCINES.filter((v) => v.petType === petType).map((v) => v.name);
}

export function getIntervalForVaccine(vaccineName: string): number | null {
  const vaccine = VACCINES.find((v) => v.name === vaccineName);
  return vaccine ? vaccine.intervalMonths : null;
}

export const VACCINATION_INTERVALS = [
  { label: 'Every month', value: 1 },
  { label: 'Every 6 months', value: 6 },
  { label: 'Every year', value: 12 },
  { label: 'Every 2 years', value: 24 },
  { label: 'Every 3 years', value: 36 },
] as const;

export function getIntervalLabel(months: number | null): string {
  if (months == null) return 'No schedule';
  const match = VACCINATION_INTERVALS.find((i) => i.value === months);
  if (match) return match.label;
  return months === 1 ? 'Every month' : `Every ${months} months`;
}
