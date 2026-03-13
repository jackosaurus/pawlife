export function getVaccinationStatus(
  nextDueDate: string | null,
): 'green' | 'amber' | 'overdue' {
  if (!nextDueDate) return 'green';

  const now = new Date();
  const due = new Date(nextDueDate);

  // Reset time portion for date-only comparison
  now.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays <= 30) return 'amber';
  return 'green';
}

export function getMedicationStatus(
  isCompleted: boolean,
): 'green' | 'amber' {
  return isCompleted ? 'amber' : 'green';
}
