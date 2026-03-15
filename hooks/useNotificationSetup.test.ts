import { renderHook } from '@testing-library/react-native';

// Mock expo-notifications — must define mock fns inside the factory
// because setNotificationHandler is called at module level
const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockGetExpoPushTokenAsync = jest.fn();
const mockSetNotificationChannelAsync = jest.fn();
const mockAddNotificationResponseReceivedListener = jest.fn();
const mockRemoveNotificationSubscription = jest.fn();

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: (...args: unknown[]) =>
    mockGetPermissionsAsync(...args),
  requestPermissionsAsync: (...args: unknown[]) =>
    mockRequestPermissionsAsync(...args),
  getExpoPushTokenAsync: (...args: unknown[]) =>
    mockGetExpoPushTokenAsync(...args),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: (...args: unknown[]) =>
    mockSetNotificationChannelAsync(...args),
  addNotificationResponseReceivedListener: (...args: unknown[]) =>
    mockAddNotificationResponseReceivedListener(...args),
  removeNotificationSubscription: (...args: unknown[]) =>
    mockRemoveNotificationSubscription(...args),
  AndroidImportance: { HIGH: 4 },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        eas: { projectId: 'test-project-id' },
      },
    },
  },
}));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockRegisterPushToken = jest.fn();
jest.mock('@/services/notificationService', () => ({
  notificationService: {
    registerPushToken: (...args: unknown[]) => mockRegisterPushToken(...args),
  },
}));

// Import after mocks are set up
import { useNotificationSetup } from './useNotificationSetup';

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPermissionsAsync.mockResolvedValue({ status: 'granted' });
  mockGetExpoPushTokenAsync.mockResolvedValue({
    data: 'ExponentPushToken[xxx]',
  });
  mockRegisterPushToken.mockResolvedValue(undefined);
  mockAddNotificationResponseReceivedListener.mockReturnValue({
    remove: jest.fn(),
  });
});

describe('useNotificationSetup', () => {
  it('does nothing when userId is null', () => {
    renderHook(() => useNotificationSetup(null));
    expect(mockGetPermissionsAsync).not.toHaveBeenCalled();
  });

  it('registers push token when permission is granted', async () => {
    renderHook(() => useNotificationSetup('u1'));

    // Wait for async operations
    await new Promise((r) => setTimeout(r, 0));

    expect(mockGetPermissionsAsync).toHaveBeenCalled();
    expect(mockGetExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: 'test-project-id',
    });
    expect(mockRegisterPushToken).toHaveBeenCalledWith(
      'u1',
      'ExponentPushToken[xxx]',
      'ios',
    );
  });

  it('requests permission if not already granted', async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: 'undetermined' });
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });

    renderHook(() => useNotificationSetup('u1'));
    await new Promise((r) => setTimeout(r, 0));

    expect(mockRequestPermissionsAsync).toHaveBeenCalled();
    expect(mockGetExpoPushTokenAsync).toHaveBeenCalled();
  });

  it('does not register token if permission denied', async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: 'denied' });
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'denied' });

    renderHook(() => useNotificationSetup('u1'));
    await new Promise((r) => setTimeout(r, 0));

    expect(mockRegisterPushToken).not.toHaveBeenCalled();
  });

  it('sets up notification tap listener', () => {
    renderHook(() => useNotificationSetup('u1'));
    expect(
      mockAddNotificationResponseReceivedListener,
    ).toHaveBeenCalledWith(expect.any(Function));
  });

  it('cleans up listener on unmount', () => {
    const mockSubscription = { remove: jest.fn() };
    mockAddNotificationResponseReceivedListener.mockReturnValue(
      mockSubscription,
    );

    const { unmount } = renderHook(() => useNotificationSetup('u1'));
    unmount();

    expect(mockRemoveNotificationSubscription).toHaveBeenCalledWith(
      mockSubscription,
    );
  });
});
