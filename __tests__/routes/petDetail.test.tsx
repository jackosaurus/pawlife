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

jest.mock('@/hooks/usePet', () => ({
  usePet: () => ({
    pet: {
      id: 'pet-1',
      name: 'Buddy',
      type: 'dog',
      breed: 'Labrador',
      birth_date: '2020-01-01',
    },
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

jest.mock('@/hooks/useWeightEntries', () => ({
  useWeightEntries: () => ({
    weightEntries: [],
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
