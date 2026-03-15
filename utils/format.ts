/**
 * Masks an email address for privacy: shows the first character, adds ***,
 * then shows @domain. E.g. "jack@gmail.com" -> "j***@gmail.com"
 */
export function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex < 1) return '***';
  const firstChar = email[0];
  const domain = email.slice(atIndex);
  return `${firstChar}***${domain}`;
}
