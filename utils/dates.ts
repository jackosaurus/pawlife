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

export function formatDistanceToNow(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month ago';
  if (diffMonths < 12) return `${diffMonths} months ago`;
  const diffYears = Math.floor(diffDays / 365);
  if (diffYears === 1) return '1 year ago';
  return `${diffYears} years ago`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const datePart = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
}
