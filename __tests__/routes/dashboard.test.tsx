import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DashboardScreen from '../../app/(main)/index';

const mockPush = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    addListener: jest.fn(() => jest.fn()),
  }),
}));

jest.mock('@/hooks/usePets', () => ({
  usePets: () => ({
    pets: [],
    loading: false,
    error: null,
    refresh: jest.fn(),
  }),
}));

jest.mock('@/hooks/useActionItems', () => ({
  useActionItems: () => ({
    actionItems: [],
    refresh: jest.fn(),
  }),
}));

jest.mock('@/services/healthService', () => ({
  healthService: {
    logMedicationDose: jest.fn(),
    logVaccinationDose: jest.fn(),
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('@/constants/colors', () => ({
  Colors: {
    textPrimary: '#2D2A26',
    textSecondary: '#7A756E',
    primary: '#4A2157',
    border: '#EDE8DF',
    background: '#FFF8E7',
    statusOverdue: '#E8735A',
    inputFill: '#F5F3F0',
  },
}));

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the menu button (paw icon) in the header', () => {
    const { getByTestId } = render(<DashboardScreen />);
    expect(getByTestId('menu-button')).toBeTruthy();
  });

  it('does NOT render the legacy settings-button', () => {
    const { queryByTestId } = render(<DashboardScreen />);
    expect(queryByTestId('settings-button')).toBeNull();
  });

  it('navigates to /(main)/menu when menu button pressed', () => {
    const { getByTestId } = render(<DashboardScreen />);
    fireEvent.press(getByTestId('menu-button'));
    expect(mockPush).toHaveBeenCalledWith('/(main)/menu');
  });

  it('does NOT navigate to /(main)/settings on header icon press', () => {
    const { getByTestId } = render(<DashboardScreen />);
    fireEvent.press(getByTestId('menu-button'));
    expect(mockPush).not.toHaveBeenCalledWith('/(main)/settings');
  });

  it('uses paw-outline icon name', () => {
    const { UNSAFE_root } = render(<DashboardScreen />);
    const icons = UNSAFE_root.findAllByType('Ionicons' as never);
    const headerIcon = icons.find(
      (i) => (i.props as { name?: string }).name === 'paw-outline',
    );
    expect(headerIcon).toBeTruthy();
  });
});
