import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AllergyDetailScreen from '../../app/(main)/pets/[petId]/allergies/[allergyId]';

const mockBack = jest.fn();
const mockGetById = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ petId: 'pet-1', allergyId: 'a1' }),
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
}));

jest.mock('@/services/allergyService', () => ({
  allergyService: {
    getById: (...args: unknown[]) => mockGetById(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    remove: (...args: unknown[]) => mockRemove(...args),
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockGetById.mockResolvedValue({
    id: 'a1',
    pet_id: 'pet-1',
    allergen: 'Chicken',
    created_by: null,
    modified_by: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  });
});

describe('AllergyDetailScreen', () => {
  it('renders the existing allergen value once loaded', async () => {
    const { findByDisplayValue, getByText } = render(<AllergyDetailScreen />);
    expect(await findByDisplayValue('Chicken')).toBeTruthy();
    expect(getByText('Edit Allergy')).toBeTruthy();
    expect(getByText('Delete')).toBeTruthy();
  });

  it('saves changes via the header Save button', async () => {
    mockUpdate.mockResolvedValue({ id: 'a1', allergen: 'Chicken Updated' });
    const { findByDisplayValue, getByTestId, getByPlaceholderText } = render(
      <AllergyDetailScreen />,
    );
    await findByDisplayValue('Chicken');
    fireEvent.changeText(getByPlaceholderText('e.g. Chicken'), 'Beef');
    fireEvent.press(getByTestId('save-button'));
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('a1', { allergen: 'Beef' });
    });
    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('opens the delete confirmation modal when Delete is tapped', async () => {
    const { findByDisplayValue, getByText, getByTestId } = render(
      <AllergyDetailScreen />,
    );
    await findByDisplayValue('Chicken');
    fireEvent.press(getByText('Delete'));
    expect(getByTestId('confirm-delete-button')).toBeTruthy();
  });

  it('removes the allergy when confirmed', async () => {
    mockRemove.mockResolvedValue(undefined);
    const { findByDisplayValue, getByText, getByTestId } = render(
      <AllergyDetailScreen />,
    );
    await findByDisplayValue('Chicken');
    fireEvent.press(getByText('Delete'));
    fireEvent.press(getByTestId('confirm-delete-button'));
    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith('a1');
    });
    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
  });
});
