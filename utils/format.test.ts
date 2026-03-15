import { maskEmail } from './format';

describe('maskEmail', () => {
  it('masks a standard email', () => {
    expect(maskEmail('jack@gmail.com')).toBe('j***@gmail.com');
  });

  it('masks a single-character local part', () => {
    expect(maskEmail('a@example.com')).toBe('a***@example.com');
  });

  it('masks a long local part', () => {
    expect(maskEmail('longusername@domain.org')).toBe('l***@domain.org');
  });

  it('handles email with subdomain', () => {
    expect(maskEmail('user@mail.example.co.uk')).toBe('u***@mail.example.co.uk');
  });

  it('returns *** for invalid email without @', () => {
    expect(maskEmail('noemail')).toBe('***');
  });

  it('returns *** for email starting with @', () => {
    expect(maskEmail('@domain.com')).toBe('***');
  });

  it('handles email with special characters in local part', () => {
    expect(maskEmail('user+tag@gmail.com')).toBe('u***@gmail.com');
  });
});
