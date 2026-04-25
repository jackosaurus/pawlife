import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EditPetScreen from '../../app/(main)/pets/[petId]/edit';

const mockBack = jest.fn();
const mockGetPet = jest.fn();
const mockUpdatePet = jest.fn();
const mockAllergyCreate = jest.fn();
const mockAllergyRemove = jest.fn();
let mockAllergiesData: { id: string; allergen: string }[] = [];

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ petId: 'pet-1' }),
  useRouter: () => ({ back: mockBack, navigate: jest.fn() }),
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
    getById: (...args: unknown[]) => mockGetPet(...args),
    update: (...args: unknown[]) => mockUpdatePet(...args),
    uploadProfilePhoto: jest.fn(),
    archive: jest.fn(),
  },
}));

jest.mock('@/services/allergyService', () => ({
  allergyService: {
    create: (...args: unknown[]) => mockAllergyCreate(...args),
    remove: (...args: unknown[]) => mockAllergyRemove(...args),
  },
}));

jest.mock('@/hooks/usePetAllergies', () => ({
  usePetAllergies: () => ({
    data: mockAllergiesData,
    loading: false,
    error: null,
    refresh: jest.fn(),
  }),
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ session: { user: { id: 'user-1' } } }),
}));

jest.mock('@/components/pets/CutenessGauge', () => ({
  CutenessGauge: () => null,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

const basePet = {
  id: 'pet-1',
  pet_type: 'dog' as const,
  name: 'Buddy',
  breed: 'Labrador',
  sex: 'male' as const,
  date_of_birth: '2020-01-01',
  approximate_age_months: null,
  microchip_number: null,
  profile_photo_url: null,
  insurance_provider: 'Petplan',
  insurance_policy_number: 'POL-1',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetPet.mockResolvedValue({ ...basePet });
  mockUpdatePet.mockResolvedValue({ ...basePet });
  mockAllergiesData = [];
});

describe('EditPetScreen — insurance fields', () => {
  it('prefills the insurance fields from the pet record', async () => {
    const { findByDisplayValue } = render(<EditPetScreen />);
    expect(await findByDisplayValue('Petplan')).toBeTruthy();
    expect(await findByDisplayValue('POL-1')).toBeTruthy();
  });

  it('saves updated insurance fields', async () => {
    const { findByDisplayValue, getByPlaceholderText, getByText } = render(
      <EditPetScreen />,
    );
    await findByDisplayValue('Petplan');

    fireEvent.changeText(
      getByPlaceholderText('e.g. Petplan'),
      'Bought By Many',
    );
    fireEvent.changeText(getByPlaceholderText('Your policy reference'), 'POL-2');
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(mockUpdatePet).toHaveBeenCalledTimes(1);
    });
    expect(mockUpdatePet).toHaveBeenCalledWith(
      'pet-1',
      expect.objectContaining({
        insurance_provider: 'Bought By Many',
        insurance_policy_number: 'POL-2',
      }),
    );
  });

  it('coerces blank insurance fields to null on save', async () => {
    const { findByDisplayValue, getByPlaceholderText, getByText } = render(
      <EditPetScreen />,
    );
    await findByDisplayValue('Petplan');

    fireEvent.changeText(getByPlaceholderText('e.g. Petplan'), '');
    fireEvent.changeText(getByPlaceholderText('Your policy reference'), '   ');
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(mockUpdatePet).toHaveBeenCalledTimes(1);
    });
    expect(mockUpdatePet).toHaveBeenCalledWith(
      'pet-1',
      expect.objectContaining({
        insurance_provider: null,
        insurance_policy_number: null,
      }),
    );
  });
});

describe('EditPetScreen — allergies (deferred persistence)', () => {
  it('renders existing allergies as chips on load', async () => {
    mockAllergiesData = [
      { id: 'a1', allergen: 'Chicken' },
      { id: 'a2', allergen: 'Beef' },
    ];
    const { findByText, getByText } = render(<EditPetScreen />);
    await findByText('Chicken');
    expect(getByText('Beef')).toBeTruthy();
  });

  it('adds an allergen to local state without calling allergyService.create', async () => {
    const { findByDisplayValue, getByTestId, getByText } = render(
      <EditPetScreen />,
    );
    await findByDisplayValue('Buddy');

    fireEvent.changeText(getByTestId('allergy-input'), 'Chicken');
    fireEvent.press(getByTestId('add-allergen-button'));

    expect(getByText('Chicken')).toBeTruthy();
    expect(mockAllergyCreate).not.toHaveBeenCalled();
  });

  it('removes a chip from local state without calling allergyService.remove', async () => {
    mockAllergiesData = [{ id: 'a1', allergen: 'Chicken' }];
    const { findByText, queryByText, getByTestId } = render(<EditPetScreen />);
    await findByText('Chicken');

    fireEvent.press(getByTestId('allergy-chip-remove-Chicken'));

    expect(queryByText('Chicken')).toBeNull();
    expect(mockAllergyRemove).not.toHaveBeenCalled();
  });

  it('on Save, calls petService.update first, then create for adds and remove for deletions', async () => {
    mockAllergiesData = [
      { id: 'a1', allergen: 'Chicken' },
      { id: 'a2', allergen: 'Beef' },
    ];
    mockAllergyCreate.mockImplementation(async (input: { allergen: string }) => ({
      id: `new-${input.allergen}`,
      allergen: input.allergen,
    }));
    mockAllergyRemove.mockResolvedValue(undefined);

    const callOrder: string[] = [];
    mockUpdatePet.mockImplementation(async () => {
      callOrder.push('update');
      return { ...basePet };
    });
    mockAllergyCreate.mockImplementation(async (input: { allergen: string }) => {
      callOrder.push(`create:${input.allergen}`);
      return { id: `new-${input.allergen}`, allergen: input.allergen };
    });
    mockAllergyRemove.mockImplementation(async (id: string) => {
      callOrder.push(`remove:${id}`);
    });

    const { findByText, getByTestId, getByText } = render(<EditPetScreen />);
    await findByText('Chicken');

    // Remove Beef.
    fireEvent.press(getByTestId('allergy-chip-remove-Beef'));
    // Add Pork.
    fireEvent.changeText(getByTestId('allergy-input'), 'Pork');
    fireEvent.press(getByTestId('add-allergen-button'));

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(mockUpdatePet).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockAllergyCreate).toHaveBeenCalledWith({
        pet_id: 'pet-1',
        allergen: 'Pork',
      });
    });
    await waitFor(() => {
      expect(mockAllergyRemove).toHaveBeenCalledWith('a2');
    });

    // Order: update first, then any allergy ops.
    expect(callOrder[0]).toBe('update');
    expect(callOrder).toContain('create:Pork');
    expect(callOrder).toContain('remove:a2');
  });

  it('shows inline duplicate error when adding a duplicate allergen (case-insensitive)', async () => {
    mockAllergiesData = [{ id: 'a1', allergen: 'Chicken' }];
    const { findByText, getByTestId, getByText } = render(<EditPetScreen />);
    await findByText('Chicken');

    fireEvent.changeText(getByTestId('allergy-input'), 'chicken');
    fireEvent.press(getByTestId('add-allergen-button'));

    expect(getByText('Already on the list.')).toBeTruthy();
    expect(mockAllergyCreate).not.toHaveBeenCalled();
  });

  it('empty allergen input does not break submit', async () => {
    const { findByDisplayValue, getByText } = render(<EditPetScreen />);
    await findByDisplayValue('Buddy');

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(mockUpdatePet).toHaveBeenCalledTimes(1);
    });
    expect(mockAllergyCreate).not.toHaveBeenCalled();
    expect(mockAllergyRemove).not.toHaveBeenCalled();
  });

  it('partial-failure: bio still saved, error surfaced, failed allergen stays in pending list', async () => {
    mockUpdatePet.mockResolvedValue({ ...basePet });
    mockAllergyCreate.mockRejectedValue(
      new Error('duplicate key value violates unique constraint'),
    );

    const { findByDisplayValue, getByTestId, getByText, findByText } = render(
      <EditPetScreen />,
    );
    await findByDisplayValue('Buddy');

    fireEvent.changeText(getByTestId('allergy-input'), 'Chicken');
    fireEvent.press(getByTestId('add-allergen-button'));

    fireEvent.press(getByText('Save'));

    // Bio update went through.
    await waitFor(() => {
      expect(mockUpdatePet).toHaveBeenCalled();
    });
    // Error surfaced referencing the failed allergen.
    expect(await findByText(/Couldn't save allergen "Chicken"/)).toBeTruthy();
    // The chip is still on screen for retry.
    expect(getByText('Chicken')).toBeTruthy();
    // We did NOT navigate back.
    expect(mockBack).not.toHaveBeenCalled();
  });
});
