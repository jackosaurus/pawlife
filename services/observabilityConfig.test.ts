/**
 * Gate matrix tests. Tests reset env vars between cases to assert the truth
 * table from `pawlife-v1-posthog-plan.md` §8.
 */

jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.0.0',
  nativeBuildVersion: '42',
}));

const ENV_KEYS = [
  'EXPO_PUBLIC_ENV',
  'EXPO_PUBLIC_TEST_OBSERVABILITY',
  'EXPO_PUBLIC_POSTHOG_KEY',
  'EXPO_PUBLIC_POSTHOG_HOST',
] as const;

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  jest.resetModules();
  // Start each test with a clean slate. Force NODE_ENV away from 'test' so
  // the gate decisions come from EXPO_PUBLIC_ENV (Jest's NODE_ENV=test would
  // otherwise short-circuit getEnvironment() to 'test' and force-disable).
  const fresh: NodeJS.ProcessEnv = { ...ORIGINAL_ENV };
  for (const k of ENV_KEYS) delete fresh[k];
  fresh.NODE_ENV = 'development';
  process.env = fresh;
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

function load() {
  return require('./observabilityConfig');
}

describe('isObservabilityEnabled — gate matrix', () => {
  it('development + key set → false', () => {
    process.env.EXPO_PUBLIC_ENV = 'development';
    process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
    expect(load().isObservabilityEnabled()).toBe(false);
  });

  it('development + key set + TEST_OBSERVABILITY=true → true', () => {
    process.env.EXPO_PUBLIC_ENV = 'development';
    process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
    process.env.EXPO_PUBLIC_TEST_OBSERVABILITY = 'true';
    expect(load().isObservabilityEnabled()).toBe(true);
  });

  it('preview + key set → false', () => {
    process.env.EXPO_PUBLIC_ENV = 'preview';
    process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
    expect(load().isObservabilityEnabled()).toBe(false);
  });

  it('preview + key set + TEST_OBSERVABILITY=true → true', () => {
    process.env.EXPO_PUBLIC_ENV = 'preview';
    process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
    process.env.EXPO_PUBLIC_TEST_OBSERVABILITY = 'true';
    expect(load().isObservabilityEnabled()).toBe(true);
  });

  it('production + key set → true', () => {
    process.env.EXPO_PUBLIC_ENV = 'production';
    process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
    expect(load().isObservabilityEnabled()).toBe(true);
  });

  it('production + no key → false', () => {
    process.env.EXPO_PUBLIC_ENV = 'production';
    expect(load().isObservabilityEnabled()).toBe(false);
  });

  it('production + empty key → false', () => {
    process.env.EXPO_PUBLIC_ENV = 'production';
    process.env.EXPO_PUBLIC_POSTHOG_KEY = '';
    expect(load().isObservabilityEnabled()).toBe(false);
  });

  it('test env (NODE_ENV=test) → always false even with TEST_OBSERVABILITY=true', () => {
    process.env.NODE_ENV = 'test';
    process.env.EXPO_PUBLIC_POSTHOG_KEY = 'phc_test';
    process.env.EXPO_PUBLIC_TEST_OBSERVABILITY = 'true';
    // Don't set EXPO_PUBLIC_ENV — getEnvironment() will fall through to NODE_ENV.
    expect(load().isObservabilityEnabled()).toBe(false);
  });
});

describe('getEnvironment', () => {
  it('returns development when EXPO_PUBLIC_ENV unset (and NODE_ENV not test)', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    expect(load().getEnvironment()).toBe('development');
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('returns the explicit value when set', () => {
    process.env.EXPO_PUBLIC_ENV = 'production';
    expect(load().getEnvironment()).toBe('production');
  });

  it('falls through to "development" for unrecognized values', () => {
    process.env.EXPO_PUBLIC_ENV = 'staging' as 'production';
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    expect(load().getEnvironment()).toBe('development');
    process.env.NODE_ENV = originalNodeEnv;
  });
});

describe('getRelease + getAppVersion + getBuildNumber', () => {
  it('formats release as bemy@<version>+<build>', () => {
    expect(load().getRelease()).toBe('bemy@1.0.0+42');
  });

  it('returns the raw version + build', () => {
    const mod = load();
    expect(mod.getAppVersion()).toBe('1.0.0');
    expect(mod.getBuildNumber()).toBe('42');
  });
});

describe('getPostHogHost', () => {
  it('defaults to https://eu.i.posthog.com', () => {
    expect(load().getPostHogHost()).toBe('https://eu.i.posthog.com');
  });

  it('honors override', () => {
    process.env.EXPO_PUBLIC_POSTHOG_HOST = 'https://us.i.posthog.com';
    expect(load().getPostHogHost()).toBe('https://us.i.posthog.com');
  });
});
