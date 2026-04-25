import React from 'react';
import { render } from '@testing-library/react-native';
import PetDetailScreen from '../../app/(main)/pets/[petId]';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ petId: 'pet-1' }),
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    addListener: jest.fn(() => jest.fn()),
  }),
}));

const basePet = {
  id: 'pet-1',
  name: 'Buddy',
  type: 'dog',
  breed: 'Labrador',
  birth_date: '2020-01-01',
  insurance_provider: null as string | null,
  insurance_policy_number: null as string | null,
};
const mockPet = { ...basePet };
jest.mock('@/hooks/usePet', () => ({
  usePet: () => ({
    pet: mockPet,
    loading: false,
    error: null,
    refresh: jest.fn(),
  }),
}));

jest.mock('@/hooks/useFoodEntries', () => ({
  useFoodEntries: () => ({
    currentFood: null,
    history: [],
    refresh: jest.fn(),
  }),
}));

jest.mock('@/hooks/useVaccinations', () => ({
  useVaccinations: () => ({
    vaccinations: [],
    refresh: jest.fn(),
  }),
}));

jest.mock('@/hooks/useMedications', () => ({
  useMedications: () => ({
    medications: [],
    refresh: jest.fn(),
  }),
}));

jest.mock('@/hooks/useArchivedMedications', () => ({
  useArchivedMedications: () => ({
    data: [],
    refresh: jest.fn(),
  }),
}));

jest.mock('@/hooks/useWeightEntries', () => ({
  useWeightEntries: () => ({
    weightEntries: [],
    refresh: jest.fn(),
  }),
}));

const mockAllergiesRefresh = jest.fn();
let mockAllergiesData: { id: string; allergen: string }[] = [];
jest.mock('@/hooks/usePetAllergies', () => ({
  usePetAllergies: () => ({
    data: mockAllergiesData,
    loading: false,
    error: null,
    refresh: mockAllergiesRefresh,
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

describe('PetDetailScreen tab order', () => {
  it('renders tabs in the order Medicines, Vaccinations, Food, Weight', () => {
    const { getAllByTestId } = render(<PetDetailScreen />);

    const tabKeys = ['medications', 'vaccinations', 'food', 'weight'];
    const tabs = tabKeys.map((k) => getAllByTestId(`tab-${k}`)[0]);

    // Confirm presence
    tabs.forEach((t) => expect(t).toBeTruthy());

    // Confirm visual order via the labels rendered in document order.
    // The TabBar renders a single Text child per tab containing the label.
    const labels = tabs.map((t) => {
      // Walk the first Text descendant
      // children[0] is the Text node for the tab label
      // (and children[1], if present, is the active underline View)
      const textNode = t.children[0] as { props?: { children?: string } };
      return textNode?.props?.children;
    });

    expect(labels).toEqual(['Medicines', 'Vaccinations', 'Food', 'Weight']);
  });

  it('defaults to the Medicines tab as active (first tab)', () => {
    const { getByTestId } = render(<PetDetailScreen />);
    // Active tab includes a second child (the underline View). Inactive tabs
    // only have the Text child, so child count is the cheap check.
    const med = getByTestId('tab-medications');
    const food = getByTestId('tab-food');
    expect(med.children.length).toBeGreaterThan(food.children.length);
  });
});

describe('PetDetailScreen allergies + insurance cards', () => {
  beforeEach(() => {
    mockAllergiesData = [];
    mockPet.insurance_provider = null;
    mockPet.insurance_policy_number = null;
  });

  it('renders empty allergies state with an inline add link', () => {
    const { getByText, getByTestId } = render(<PetDetailScreen />);
    expect(getByText('ALLERGIES')).toBeTruthy();
    expect(getByText('No known allergies yet.')).toBeTruthy();
    expect(getByTestId('add-allergy-link')).toBeTruthy();
  });

  it('renders allergy pills when allergies exist', () => {
    mockAllergiesData = [
      { id: 'a1', allergen: 'Chicken' },
      { id: 'a2', allergen: 'Beef' },
    ];
    const { getByText, getByTestId } = render(<PetDetailScreen />);
    expect(getByText('Chicken')).toBeTruthy();
    expect(getByText('Beef')).toBeTruthy();
    expect(getByTestId('allergy-pill-a1')).toBeTruthy();
    expect(getByTestId('allergy-pill-a2')).toBeTruthy();
  });

  it('renders an Add insurance link when both fields are empty', () => {
    const { getByTestId, getByText } = render(<PetDetailScreen />);
    expect(getByText('INSURANCE')).toBeTruthy();
    expect(getByTestId('add-insurance-link')).toBeTruthy();
  });

  it('renders provider + policy rows when insurance is set', () => {
    mockPet.insurance_provider = 'Petplan';
    mockPet.insurance_policy_number = 'ABC123';
    const { getByText, queryByTestId } = render(<PetDetailScreen />);
    expect(getByText('Petplan')).toBeTruthy();
    expect(getByText('ABC123')).toBeTruthy();
    expect(queryByTestId('add-insurance-link')).toBeNull();
  });
});
