/**
 * Tests for observabilityService init/identify/alias/reset/captureException.
 * Mock posthog-react-native + observabilityConfig to control the gate.
 */

const mockRegister = jest.fn();
const mockAlias = jest.fn();
const mockIdentify = jest.fn();
const mockReset = jest.fn();
const mockCaptureException = jest.fn();
const mockShutdown = jest.fn().mockResolvedValue(undefined);
const mockCtor = jest.fn();

jest.mock('posthog-react-native', () => {
  return {
    __esModule: true,
    default: class MockPostHog {
      constructor(...args: unknown[]) {
        mockCtor(...args);
      }
      register = mockRegister;
      alias = mockAlias;
      identify = mockIdentify;
      reset = mockReset;
      captureException = mockCaptureException;
      shutdown = mockShutdown;
    },
  };
});

jest.mock('./observabilityConfig', () => ({
  isObservabilityEnabled: jest.fn(),
  getPostHogKey: jest.fn(),
  getPostHogHost: jest.fn(() => 'https://eu.i.posthog.com'),
  getAppVersion: jest.fn(() => '1.0.0'),
  getBuildNumber: jest.fn(() => '42'),
  getEnvironment: jest.fn(() => 'production'),
}));

import { observabilityService } from './observabilityService';
import * as config from './observabilityConfig';

const mockEnabled = config.isObservabilityEnabled as jest.Mock;
const mockKey = config.getPostHogKey as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  observabilityService._resetForTests();
});

describe('observabilityService.init', () => {
  it('is a no-op when disabled (no PostHog ctor call)', () => {
    mockEnabled.mockReturnValue(false);
    observabilityService.init();
    expect(mockCtor).not.toHaveBeenCalled();
  });

  it('constructs PostHog with key + host when enabled', () => {
    mockEnabled.mockReturnValue(true);
    mockKey.mockReturnValue('phc_test');
    observabilityService.init();
    expect(mockCtor).toHaveBeenCalledTimes(1);
    expect(mockCtor.mock.calls[0][0]).toBe('phc_test');
    expect(mockCtor.mock.calls[0][1]).toMatchObject({
      host: 'https://eu.i.posthog.com',
      enableSessionReplay: false,
    });
  });

  it('registers super-properties for app version + build + env', () => {
    mockEnabled.mockReturnValue(true);
    mockKey.mockReturnValue('phc_test');
    observabilityService.init();
    expect(mockRegister).toHaveBeenCalledWith({
      app_version: '1.0.0',
      build_number: '42',
      env: 'production',
    });
  });

  it('is idempotent — does not double-construct', () => {
    mockEnabled.mockReturnValue(true);
    mockKey.mockReturnValue('phc_test');
    observabilityService.init();
    observabilityService.init();
    expect(mockCtor).toHaveBeenCalledTimes(1);
  });
});

describe('observabilityService.identify', () => {
  it('no-op when disabled', () => {
    mockEnabled.mockReturnValue(false);
    observabilityService.identify('user-1');
    expect(mockIdentify).not.toHaveBeenCalled();
    expect(mockAlias).not.toHaveBeenCalled();
  });

  it('calls alias() before identify() to preserve anon→identified merge', () => {
    mockEnabled.mockReturnValue(true);
    mockKey.mockReturnValue('phc_test');
    observabilityService.init();
    observabilityService.identify('user-1');
    // Both fire; alias before identify in code order.
    expect(mockAlias).toHaveBeenCalledWith('user-1');
    expect(mockIdentify).toHaveBeenCalledWith('user-1');
    const aliasOrder = mockAlias.mock.invocationCallOrder[0];
    const identifyOrder = mockIdentify.mock.invocationCallOrder[0];
    expect(aliasOrder).toBeLessThan(identifyOrder);
  });
});

describe('observabilityService.reset', () => {
  it('no-op when disabled', () => {
    mockEnabled.mockReturnValue(false);
    observabilityService.reset();
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('forwards to PostHog.reset() when enabled', () => {
    mockEnabled.mockReturnValue(true);
    mockKey.mockReturnValue('phc_test');
    observabilityService.init();
    observabilityService.reset();
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});

describe('observabilityService.captureException', () => {
  it('no-op when disabled', () => {
    mockEnabled.mockReturnValue(false);
    observabilityService.captureException(new Error('boom'));
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('forwards an Error to PostHog with merged tags + extras', () => {
    mockEnabled.mockReturnValue(true);
    mockKey.mockReturnValue('phc_test');
    observabilityService.init();
    const err = new Error('boom');
    observabilityService.captureException(err, {
      tags: { component: 'PetForm' },
      extra: { petId: 'p-1' },
    });
    expect(mockCaptureException).toHaveBeenCalledWith(err, {
      component: 'PetForm',
      petId: 'p-1',
    });
  });

  it('wraps non-Error throwables in Error', () => {
    mockEnabled.mockReturnValue(true);
    mockKey.mockReturnValue('phc_test');
    observabilityService.init();
    observabilityService.captureException('string error');
    const arg = mockCaptureException.mock.calls[0][0];
    expect(arg).toBeInstanceOf(Error);
    expect((arg as Error).message).toBe('string error');
  });

  it('re-entrancy guard prevents recursive capture', () => {
    mockEnabled.mockReturnValue(true);
    mockKey.mockReturnValue('phc_test');
    observabilityService.init();
    let recursed = false;
    mockCaptureException.mockImplementationOnce(() => {
      // Simulate a throw inside captureException that the wrapper catches
      // and re-enters captureException via the catch path.
      observabilityService.captureException(new Error('nested'));
      recursed = true;
    });
    observabilityService.captureException(new Error('outer'));
    expect(recursed).toBe(true);
    // Only the outer call reaches the SDK; the nested call is guarded out.
    expect(mockCaptureException).toHaveBeenCalledTimes(1);
  });
});

describe('observabilityService.alias', () => {
  it('no-op when disabled', () => {
    mockEnabled.mockReturnValue(false);
    observabilityService.alias('user-1');
    expect(mockAlias).not.toHaveBeenCalled();
  });

  it('forwards to PostHog.alias when enabled', () => {
    mockEnabled.mockReturnValue(true);
    mockKey.mockReturnValue('phc_test');
    observabilityService.init();
    mockAlias.mockClear();
    observabilityService.alias('user-1');
    expect(mockAlias).toHaveBeenCalledWith('user-1');
  });
});

describe('observabilityService.shutdown', () => {
  it('resolves immediately when disabled', async () => {
    mockEnabled.mockReturnValue(false);
    await expect(observabilityService.shutdown()).resolves.toBeUndefined();
  });

  it('calls PostHog.shutdown when enabled', async () => {
    mockEnabled.mockReturnValue(true);
    mockKey.mockReturnValue('phc_test');
    observabilityService.init();
    await observabilityService.shutdown();
    expect(mockShutdown).toHaveBeenCalledTimes(1);
  });
});
