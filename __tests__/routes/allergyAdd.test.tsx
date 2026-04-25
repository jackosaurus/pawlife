import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddAllergyScreen from '../../app/(main)/pets/[petId]/allergies/add';

const mockBack = jest.fn();
const mockCreate = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ petId: 'pet-1' }),
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
}));

jest.mock('@/services/allergyService', () => ({
  allergyService: {
    create: (...args: unknown[]) => mockCreate(...args),
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AddAllergyScreen', () => {
  it('renders the title and Save button', () => {
    const { getByText } = render(<AddAllergyScreen />);
    expect(getByText('Add Allergy')).toBeTruthy();
    expect(getByText('Save Allergy')).toBeTruthy();
  });

  it('does not submit when allergen is empty', async () => {
    const { getByText } = render(<AddAllergyScreen />);
    fireEvent.press(getByText('Save Allergy'));
    await waitFor(() => {
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  it('submits allergen and navigates back on success', async () => {
    mockCreate.mockResolvedValue({ id: 'a1', allergen: 'Chicken' });
    const { getByText, getByPlaceholderText } = render(<AddAllergyScreen />);
    fireEvent.changeText(getByPlaceholderText('e.g. Chicken'), 'Chicken');
    fireEvent.press(getByText('Save Allergy'));
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        pet_id: 'pet-1',
        allergen: 'Chicken',
      });
    });
    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('shows a friendly message on duplicate-allergen errors', async () => {
    mockCreate.mockRejectedValue(
      new Error('duplicate key value violates unique constraint'),
    );
    const { getByText, getByPlaceholderText, findByText } = render(
      <AddAllergyScreen />,
    );
    fireEvent.changeText(getByPlaceholderText('e.g. Chicken'), 'Chicken');
    fireEvent.press(getByText('Save Allergy'));
    expect(await findByText('That allergen is already on the list.')).toBeTruthy();
  });
});
