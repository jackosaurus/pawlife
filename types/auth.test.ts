import { signUpSchema, signInSchema } from './auth';

describe('signUpSchema', () => {
  it('accepts valid data', () => {
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = signUpSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Please enter a valid email',
      );
    }
  });

  it('rejects short password', () => {
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      password: 'short',
      confirmPassword: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Password must be at least 8 characters',
      );
    }
  });

  it('rejects mismatched passwords', () => {
    const result = signUpSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'different456',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find(
        (i) => i.path.includes('confirmPassword'),
      );
      expect(confirmError?.message).toBe('Passwords do not match');
    }
  });
});

describe('signInSchema', () => {
  it('accepts valid data', () => {
    const result = signInSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = signInSchema.safeParse({
      email: 'bad',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = signInSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Password is required');
    }
  });
});
