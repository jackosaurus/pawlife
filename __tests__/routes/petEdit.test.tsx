import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EditPetScreen from '../../app/(main)/pets/[petId]/edit';

const mockBack = jest.fn();
const mockGetPet = jest.fn();
const mockUpdatePet = jest.fn();

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
