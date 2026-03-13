export function calculateAge(
  dateOfBirth: string | null,
  approximateAgeMonths: number | null,
): string {
  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    const now = new Date();
    if (dob > now) return 'Age unknown';

    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    if (now.getDate() < dob.getDate()) months--;
    if (months < 0) {
      years--;
      months += 12;
    }

    if (years === 0 && months === 0) return '< 1 month';
    if (years === 0) return months === 1 ? '1 month' : `${months} months`;
    if (months === 0) return years === 1 ? '1 year' : `${years} years`;
    return `${years} ${years === 1 ? 'year' : 'years'}, ${months} ${months === 1 ? 'month' : 'months'}`;
  }

  if (approximateAgeMonths != null) {
    if (approximateAgeMonths === 0) return '< 1 month';
    const years = Math.floor(approximateAgeMonths / 12);
    const months = approximateAgeMonths % 12;
    if (years === 0) return months === 1 ? '1 month' : `${months} months`;
    if (months === 0) return years === 1 ? '1 year' : `${years} years`;
    return `${years} ${years === 1 ? 'year' : 'years'}, ${months} ${months === 1 ? 'month' : 'months'}`;
  }

  return 'Age unknown';
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
