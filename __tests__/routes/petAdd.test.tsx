import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddPetScreen from '../../app/(main)/pets/add';

const mockBack = jest.fn();
const mockCreatePet = jest.fn();
const mockCreateAllergy = jest.fn();
const mockUpdatePet = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest
    .fn()
    .mockResolvedValue({ canceled: true, assets: [] }),
}));

jest.mock('@/services/petService', () => ({
  petService: {
    create: (...args: unknown[]) => mockCreatePet(...args),
    update: (...args: unknown[]) => mockUpdatePet(...args),
    uploadProfilePhoto: jest.fn(),
  },
}));

jest.mock('@/services/allergyService', () => ({
  allergyService: {
    create: (...args: unknown[]) => mockCreateAllergy(...args),
  },
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ session: { user: { id: 'user-1' } } }),
}));

jest.mock('@/stores/familyStore', () => ({
  useFamilyStore: (selector: (state: unknown) => unknown) =>
    selector({ family: { id: 'family-1' } }),
}));

jest.mock('@/components/pets/CutenessGauge', () => ({
  CutenessGauge: () => null,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockCreatePet.mockResolvedValue({
    id: 'pet-1',
    name: 'Buddy',
  });
  mockCreateAllergy.mockResolvedValue({ id: 'a1' });
});

describe('AddPetScreen — allergies and insurance', () => {
  it('adds an allergen inline and removes it', () => {
    const { getByTestId, getByPlaceholderText, queryByTestId, getByText } =
      render(<AddPetScreen />);

    fireEvent.press(getByTestId('open-allergen-input'));
    fireEvent.changeText(getByPlaceholderText('e.g. Chicken'), 'Beef');
    fireEvent.press(getByTestId('save-allergen-button'));

    // The row renders for the new allergen
    expect(getByTestId('allergen-row-0')).toBeTruthy();
    expect(getByText('Beef')).toBeTruthy();

    // Remove it
    fireEvent.press(getByTestId('remove-allergen-0'));
    expect(queryByTestId('allergen-row-0')).toBeNull();
  });

  it('rejects duplicate allergens (case-insensitive)', () => {
    const { getByTestId, getByPlaceholderText, getByText } = render(
      <AddPetScreen />,
    );

    fireEvent.press(getByTestId('open-allergen-input'));
    fireEvent.changeText(getByPlaceholderText('e.g. Chicken'), 'Chicken');
    fireEvent.press(getByTestId('save-allergen-button'));

    fireEvent.press(getByTestId('open-allergen-input'));
    fireEvent.changeText(getByPlaceholderText('e.g. Chicken'), 'chicken');
    fireEvent.press(getByTestId('save-allergen-button'));

    expect(getByText('Already on the list.')).toBeTruthy();
  });

  it('submits insurance fields and batches allergies after pet creation', async () => {
    const { getByTestId, getByPlaceholderText, getByText } = render(
      <AddPetScreen />,
    );

    fireEvent.changeText(getByPlaceholderText("What's your pet's name?"), 'Buddy');

    // Add an allergy
    fireEvent.press(getByTestId('open-allergen-input'));
    fireEvent.changeText(getByPlaceholderText('e.g. Chicken'), 'Chicken');
    fireEvent.press(getByTestId('save-allergen-button'));

    // Fill insurance
    fireEvent.changeText(getByPlaceholderText('e.g. Petplan'), 'Petplan');
    fireEvent.changeText(
      getByPlaceholderText('Your policy reference'),
      'POL-123',
    );

    fireEvent.press(getByText('Add Buddy to Your Family'));

    await waitFor(() => {
      expect(mockCreatePet).toHaveBeenCalledTimes(1);
    });

    expect(mockCreatePet).toHaveBeenCalledWith(
      expect.objectContaining({
        family_id: 'family-1',
        name: 'Buddy',
        insurance_provider: 'Petplan',
        insurance_policy_number: 'POL-123',
      }),
    );

    await waitFor(() => {
      expect(mockCreateAllergy).toHaveBeenCalledWith({
        pet_id: 'pet-1',
        allergen: 'Chicken',
      });
    });
  });

  it('passes null insurance when fields are blank', async () => {
    const { getByPlaceholderText, getByText } = render(<AddPetScreen />);
    fireEvent.changeText(getByPlaceholderText("What's your pet's name?"), 'Rex');
    fireEvent.press(getByText('Add Rex to Your Family'));

    await waitFor(() => {
      expect(mockCreatePet).toHaveBeenCalledTimes(1);
    });
    expect(mockCreatePet).toHaveBeenCalledWith(
      expect.objectContaining({
        insurance_provider: null,
        insurance_policy_number: null,
      }),
    );
  });
});
