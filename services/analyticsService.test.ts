/**
 * analyticsService tests. Mock observabilityService to control gate + client.
 */

const mockCapture = jest.fn();
const mockScreen = jest.fn();
const mockGetClient = jest.fn();

jest.mock('./observabilityService', () => ({
  observabilityService: {
    _getClient: () => mockGetClient(),
  },
}));

jest.mock('./observabilityConfig', () => ({
  isObservabilityEnabled: jest.fn(),
}));

import { analyticsService } from './analyticsService';
import * as config from './observabilityConfig';

const mockEnabled = config.isObservabilityEnabled as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetClient.mockReturnValue({
    capture: mockCapture,
    screen: mockScreen,
  });
});

describe('analyticsService.track', () => {
  it('is a no-op when disabled', () => {
    mockEnabled.mockReturnValue(false);
    analyticsService.track('pet_created', { pet_id: 'p-1', species: 'dog' });
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it('forwards to PostHog.capture with the event name + props', () => {
    mockEnabled.mockReturnValue(true);
    analyticsService.track('pet_created', { pet_id: 'p-1', species: 'dog' });
    expect(mockCapture).toHaveBeenCalledWith('pet_created', {
      pet_id: 'p-1',
      species: 'dog',
    });
  });

  it('handles every event in the taxonomy', () => {
    mockEnabled.mockReturnValue(true);
    analyticsService.track('vaccination_logged', { pet_id: 'p-1' });
    analyticsService.track('medication_dose_logged', {
      pet_id: 'p-1',
      medication_id: 'm-1',
    });
    analyticsService.track('food_entry_logged', { pet_id: 'p-1' });
    analyticsService.track('weight_entry_logged', { pet_id: 'p-1' });
    analyticsService.track('auth_signup_started', {});
    analyticsService.track('auth_signup_failed', { reason: 'invalid_email' });
    expect(mockCapture).toHaveBeenCalledTimes(6);
  });

  it('swallows SDK errors so analytics never crashes the app', () => {
    mockEnabled.mockReturnValue(true);
    mockCapture.mockImplementationOnce(() => {
      throw new Error('SDK exploded');
    });
    expect(() =>
      analyticsService.track('pet_created', { pet_id: 'p', species: 'cat' }),
    ).not.toThrow();
  });

  it('no-op when client is null even if gate says enabled', () => {
    mockEnabled.mockReturnValue(true);
    mockGetClient.mockReturnValueOnce(null);
    analyticsService.track('pet_created', { pet_id: 'p', species: 'cat' });
    expect(mockCapture).not.toHaveBeenCalled();
  });
});

describe('analyticsService.screen', () => {
  it('is a no-op when disabled', () => {
    mockEnabled.mockReturnValue(false);
    analyticsService.screen('/pets/[petId]');
    expect(mockScreen).not.toHaveBeenCalled();
  });

  it('forwards to PostHog.screen with name + props', () => {
    mockEnabled.mockReturnValue(true);
    analyticsService.screen('/pets/[petId]', { tab: 'food' });
    expect(mockScreen).toHaveBeenCalledWith('/pets/[petId]', { tab: 'food' });
  });

  it('does not require props', () => {
    mockEnabled.mockReturnValue(true);
    analyticsService.screen('/dashboard');
    expect(mockScreen).toHaveBeenCalledWith('/dashboard', undefined);
  });
});
