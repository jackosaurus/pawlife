import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import MedicationDetailScreen from '../../app/(main)/pets/[petId]/health/medication/[id]';

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ petId: 'pet-1', id: 'med-1' }),
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

const mockGetMedicationById = jest.fn();
const mockArchiveMedication = jest.fn();
const mockRestoreMedication = jest.fn();

jest.mock('@/services/healthService', () => ({
  healthService: {
    getMedicationById: (...args: unknown[]) => mockGetMedicationById(...args),
    archiveMedication: (...args: unknown[]) => mockArchiveMedication(...args),
    restoreMedication: (...args: unknown[]) => mockRestoreMedication(...args),
    deleteMedication: jest.fn(),
    deleteMedicationDose: jest.fn(),
    logMedicationDose: jest.fn(),
    getMedicationDoses: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('@/hooks/useMedicationDoses', () => ({
  useMedicationDoses: () => ({
    doses: [],
    refresh: jest.fn(),
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

const baseMed = {
  id: 'med-1',
  pet_id: 'pet-1',
  name: 'Apoquel',
  dosage: '5mg',
  frequency: 'Once daily',
  start_date: '2026-01-01',
  end_date: null,
  prescribing_vet: null,
  notes: null,
  is_archived: false,
  archived_at: null,
  created_by: null,
  modified_by: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MedicationDetailScreen — active', () => {
  beforeEach(() => {
    mockGetMedicationById.mockResolvedValue({ ...baseMed });
  });

  it('shows Log Dose, Edit, Archive, and Delete in active mode', async () => {
    const { getByText } = render(<MedicationDetailScreen />);
    await waitFor(() => {
      expect(getByText('Apoquel')).toBeTruthy();
    });
    expect(getByText('Log Dose')).toBeTruthy();
    expect(getByText('Edit')).toBeTruthy();
    expect(getByText('Archive')).toBeTruthy();
    expect(getByText('Delete')).toBeTruthy();
  });

  it('does not show Restore in active mode', async () => {
    const { queryByText, getByText } = render(<MedicationDetailScreen />);
    await waitFor(() => expect(getByText('Apoquel')).toBeTruthy());
    expect(queryByText('Restore')).toBeNull();
  });

  it('Archive button opens the confirmation modal with archive copy', async () => {
    const { getByText, queryByTestId } = render(<MedicationDetailScreen />);
    await waitFor(() => expect(getByText('Apoquel')).toBeTruthy());
    expect(queryByTestId('confirm-button')).toBeNull();
    fireEvent.press(getByText('Archive'));
    expect(getByText('Archive Apoquel?')).toBeTruthy();
    expect(getByText(/restore Apoquel anytime/)).toBeTruthy();
  });

  it('confirming Archive in the modal calls archiveMedication and reloads', async () => {
    mockArchiveMedication.mockResolvedValue(undefined);
    const { getByText, getByTestId } = render(<MedicationDetailScreen />);
    await waitFor(() => expect(getByText('Apoquel')).toBeTruthy());
    expect(mockGetMedicationById).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('Archive'));
    await act(async () => {
      fireEvent.press(getByTestId('confirm-button'));
    });
    await waitFor(() => {
      expect(mockArchiveMedication).toHaveBeenCalledWith('med-1');
    });
    await waitFor(() => {
      expect(mockGetMedicationById).toHaveBeenCalledTimes(2);
    });
  });
});

describe('MedicationDetailScreen — archived', () => {
  beforeEach(() => {
    mockGetMedicationById.mockResolvedValue({
      ...baseMed,
      is_archived: true,
      archived_at: '2026-03-01T10:00:00Z',
    });
  });

  it('shows Restore, Edit, and Delete (no Archive, no Log Dose)', async () => {
    const { getByText, queryByText } = render(<MedicationDetailScreen />);
    await waitFor(() => expect(getByText('Apoquel')).toBeTruthy());
    expect(getByText('Restore')).toBeTruthy();
    expect(getByText('Edit')).toBeTruthy();
    expect(getByText('Delete')).toBeTruthy();
    expect(queryByText('Archive')).toBeNull();
    expect(queryByText('Log Dose')).toBeNull();
  });

  it('shows the Archived status pill', async () => {
    const { getByText } = render(<MedicationDetailScreen />);
    await waitFor(() => expect(getByText('Apoquel')).toBeTruthy());
    expect(getByText('Archived')).toBeTruthy();
  });

  it('shows archived-on date line', async () => {
    const { getByText } = render(<MedicationDetailScreen />);
    await waitFor(() => expect(getByText('Apoquel')).toBeTruthy());
    // formatDate: en-GB "1 Mar 2026"
    expect(getByText(/Archived 1 Mar 2026/)).toBeTruthy();
  });

  it('Restore is instant — no confirmation modal — calls restoreMedication and reloads', async () => {
    mockRestoreMedication.mockResolvedValue(undefined);
    const { getByText, queryByTestId } = render(<MedicationDetailScreen />);
    await waitFor(() => expect(getByText('Apoquel')).toBeTruthy());
    expect(mockGetMedicationById).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.press(getByText('Restore'));
    });

    await waitFor(() => {
      expect(mockRestoreMedication).toHaveBeenCalledWith('med-1');
    });
    await waitFor(() => {
      expect(mockGetMedicationById).toHaveBeenCalledTimes(2);
    });
    // No confirmation modal should have opened.
    expect(queryByTestId('confirm-button')).toBeNull();
  });
});
