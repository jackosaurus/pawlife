import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ArchivedMedicationsScreen from '../../app/(main)/pets/[petId]/health/medication/archived';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ petId: 'pet-1' }),
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ addListener: jest.fn(() => jest.fn()) }),
}));

const mockUseArchived = jest.fn();
jest.mock('@/hooks/useArchivedMedications', () => ({
  useArchivedMedications: () => mockUseArchived(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ArchivedMedicationsScreen', () => {
  it('renders archived rows', async () => {
    mockUseArchived.mockReturnValue({
      data: [
        {
          id: 'med-1',
          pet_id: 'pet-1',
          name: 'Old Apoquel',
          dosage: '5mg',
          frequency: 'Once daily',
          archived_at: '2026-03-01T10:00:00Z',
        },
        {
          id: 'med-2',
          pet_id: 'pet-1',
          name: 'Old Heartgard',
          dosage: null,
          frequency: 'Once monthly',
          archived_at: '2026-02-01T10:00:00Z',
        },
      ],
      loading: false,
      error: null,
      refresh: jest.fn(),
    });

    const { getByText } = render(<ArchivedMedicationsScreen />);
    await waitFor(() => {
      expect(getByText('Old Apoquel')).toBeTruthy();
      expect(getByText('Old Heartgard')).toBeTruthy();
    });
    expect(getByText(/Archived 1 Mar 2026/)).toBeTruthy();
  });

  it('navigates to detail on row tap', async () => {
    mockUseArchived.mockReturnValue({
      data: [
        {
          id: 'med-1',
          pet_id: 'pet-1',
          name: 'Old Apoquel',
          dosage: '5mg',
          frequency: 'Once daily',
          archived_at: '2026-03-01T10:00:00Z',
        },
      ],
      loading: false,
      error: null,
      refresh: jest.fn(),
    });

    const { getByText } = render(<ArchivedMedicationsScreen />);
    await waitFor(() => expect(getByText('Old Apoquel')).toBeTruthy());
    fireEvent.press(getByText('Old Apoquel'));
    expect(mockPush).toHaveBeenCalledWith(
      '/(main)/pets/pet-1/health/medication/med-1',
    );
  });

  it('shows empty state when no archived meds', () => {
    mockUseArchived.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      refresh: jest.fn(),
    });

    const { getByText } = render(<ArchivedMedicationsScreen />);
    expect(getByText('No archived medications')).toBeTruthy();
  });

  it('shows loading state', () => {
    mockUseArchived.mockReturnValue({
      data: [],
      loading: true,
      error: null,
      refresh: jest.fn(),
    });

    const { queryByText } = render(<ArchivedMedicationsScreen />);
    expect(queryByText('No archived medications')).toBeNull();
  });
});
