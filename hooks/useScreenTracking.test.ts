import { renderHook } from '@testing-library/react-native';

const mockScreen = jest.fn();
let mockPathname: string | null = '/dashboard';

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
}));

jest.mock('@/services/analyticsService', () => ({
  analyticsService: {
    screen: (...args: unknown[]) => mockScreen(...args),
  },
}));

import { useScreenTracking } from './useScreenTracking';

beforeEach(() => {
  jest.clearAllMocks();
  mockPathname = '/dashboard';
});

describe('useScreenTracking', () => {
  it('fires analyticsService.screen on initial mount', () => {
    renderHook(() => useScreenTracking());
    expect(mockScreen).toHaveBeenCalledWith('/dashboard');
  });

  it('fires once per pathname change', () => {
    const { rerender } = renderHook(() => useScreenTracking());
    expect(mockScreen).toHaveBeenCalledTimes(1);

    mockPathname = '/pets/p-1';
    rerender(undefined);
    expect(mockScreen).toHaveBeenCalledTimes(2);
    expect(mockScreen).toHaveBeenLastCalledWith('/pets/p-1');
  });

  it('does not double-fire when re-rendered on the same path', () => {
    const { rerender } = renderHook(() => useScreenTracking());
    expect(mockScreen).toHaveBeenCalledTimes(1);
    rerender(undefined);
    rerender(undefined);
    expect(mockScreen).toHaveBeenCalledTimes(1);
  });

  it('skips when pathname is null', () => {
    mockPathname = null;
    renderHook(() => useScreenTracking());
    expect(mockScreen).not.toHaveBeenCalled();
  });
});
