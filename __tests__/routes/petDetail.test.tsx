import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PetDetailScreen from '../../app/(main)/pets/[petId]';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ petId: 'pet-1' }),
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
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
  breed: 'Labrador' as string | null,
  birth_date: '2020-01-01',
  date_of_birth: '2018-03-14' as string | null,
  sex: 'male' as 'male' | 'female' | 'unknown' | null,
  microchip_number: '981000000000123' as string | null,
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

let mockArchivedMedsData: { id: string; pet_id: string; name: string; archived_at: string }[] = [];
jest.mock('@/hooks/useArchivedMedications', () => ({
  useArchivedMedications: () => ({
    data: mockArchivedMedsData,
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
  it('renders tabs in the order Profile, Medicines, Vaccinations, Food, Weight', () => {
    const { getAllByTestId } = render(<PetDetailScreen />);

    const tabKeys = ['profile', 'medications', 'vaccinations', 'food', 'weight'];
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

    expect(labels).toEqual([
      'Profile',
      'Medicines',
      'Vaccinations',
      'Food',
      'Weight',
    ]);
  });

  it('Profile is the first (leftmost) tab', () => {
    const { getAllByTestId } = render(<PetDetailScreen />);
    const profileTab = getAllByTestId('tab-profile')[0];
    const profileLabel = (profileTab.children[0] as {
      props?: { children?: string };
    }).props?.children;
    expect(profileLabel).toBe('Profile');
  });

  it('defaults to the Medicines tab as active (preserves muscle memory)', () => {
    const { getByTestId } = render(<PetDetailScreen />);
    // Active tab includes a second child (the underline View). Inactive tabs
    // only have the Text child, so child count is the cheap check.
    const med = getByTestId('tab-medications');
    const profile = getByTestId('tab-profile');
    const food = getByTestId('tab-food');
    expect(med.children.length).toBeGreaterThan(food.children.length);
    // Profile is NOT the default active tab.
    expect(med.children.length).toBeGreaterThan(profile.children.length);
  });

  it('shows the Medicines empty state by default, not Profile content', () => {
    const { queryByText } = render(<PetDetailScreen />);
    // Medicines empty state copy
    expect(queryByText('No medications recorded yet.')).toBeTruthy();
    // Profile section labels should NOT be present on entry
    expect(queryByText('ABOUT')).toBeNull();
  });
});

describe('PetDetailScreen allergies + insurance cards (under Profile tab)', () => {
  beforeEach(() => {
    mockAllergiesData = [];
    mockPet.insurance_provider = null;
    mockPet.insurance_policy_number = null;
  });

  it('renders empty allergies state with an inline add link', () => {
    const { getByText, getByTestId } = render(<PetDetailScreen />);
    fireEvent.press(getByTestId('tab-profile'));
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
    fireEvent.press(getByTestId('tab-profile'));
    expect(getByText('Chicken')).toBeTruthy();
    expect(getByText('Beef')).toBeTruthy();
    expect(getByTestId('allergy-pill-a1')).toBeTruthy();
    expect(getByTestId('allergy-pill-a2')).toBeTruthy();
  });

  it('renders an Add insurance link when both fields are empty', () => {
    const { getByTestId, getByText } = render(<PetDetailScreen />);
    fireEvent.press(getByTestId('tab-profile'));
    expect(getByText('INSURANCE')).toBeTruthy();
    expect(getByTestId('add-insurance-link')).toBeTruthy();
  });

  it('renders provider + policy rows when insurance is set', () => {
    mockPet.insurance_provider = 'Petplan';
    mockPet.insurance_policy_number = 'ABC123';
    const { getByText, getByTestId, queryByTestId } = render(<PetDetailScreen />);
    fireEvent.press(getByTestId('tab-profile'));
    expect(getByText('Petplan')).toBeTruthy();
    expect(getByText('ABC123')).toBeTruthy();
    expect(queryByTestId('add-insurance-link')).toBeNull();
  });
});

describe('PetDetailScreen Profile tab', () => {
  beforeEach(() => {
    mockAllergiesData = [];
    mockPet.breed = 'Labrador';
    mockPet.date_of_birth = '2018-03-14';
    mockPet.sex = 'male';
    mockPet.microchip_number = '981000000000123';
    mockPet.insurance_provider = null;
    mockPet.insurance_policy_number = null;
  });

  it('renders ABOUT, ALLERGIES, and INSURANCE cards when Profile tab is active', () => {
    const { getByText, getByTestId } = render(<PetDetailScreen />);
    fireEvent.press(getByTestId('tab-profile'));
    expect(getByText('ABOUT')).toBeTruthy();
    expect(getByText('ALLERGIES')).toBeTruthy();
    expect(getByText('INSURANCE')).toBeTruthy();
  });

  it('renders ABOUT rows: breed, sex, dob (day-first), microchip', () => {
    const { getByText, getAllByText, getByTestId } = render(<PetDetailScreen />);
    fireEvent.press(getByTestId('tab-profile'));
    expect(getByText('Breed')).toBeTruthy();
    // Breed also appears in the sticky header, so there should be >=1 match.
    expect(getAllByText('Labrador').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Sex')).toBeTruthy();
    // "Male" appears as the ABOUT row value; it may also appear elsewhere.
    expect(getAllByText('Male').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Date of birth')).toBeTruthy();
    expect(getByText('14 Mar 2018')).toBeTruthy();
    expect(getByText('Microchip number')).toBeTruthy();
    expect(getByText('981000000000123')).toBeTruthy();
  });

  it('renders "Not added" for empty ABOUT values', () => {
    mockPet.breed = null;
    mockPet.sex = null;
    mockPet.date_of_birth = null;
    mockPet.microchip_number = null;
    const { getAllByText, getByTestId } = render(<PetDetailScreen />);
    fireEvent.press(getByTestId('tab-profile'));
    // All four rows render "Not added"
    expect(getAllByText('Not added')).toHaveLength(4);
  });

  it('does not render the add-record card on the Profile tab', () => {
    const { queryByText, getByTestId } = render(<PetDetailScreen />);
    fireEvent.press(getByTestId('tab-profile'));
    expect(queryByText('Add medication')).toBeNull();
    expect(queryByText('Add vaccination')).toBeNull();
    expect(queryByText('Add weight entry')).toBeNull();
  });

  it('does not render ABOUT/ALLERGIES/INSURANCE on the Medicines tab (regression guard)', () => {
    const { queryByText } = render(<PetDetailScreen />);
    // Default tab is Medicines; profile section labels should be absent.
    expect(queryByText('ABOUT')).toBeNull();
    expect(queryByText('ALLERGIES')).toBeNull();
    expect(queryByText('INSURANCE')).toBeNull();
  });
});

describe('PetDetailScreen archived medications footer', () => {
  beforeEach(() => {
    mockArchivedMedsData = [];
    mockPush.mockClear();
  });

  it('does not render the archived medications footer when count is 0', () => {
    mockArchivedMedsData = [];
    const { queryByText } = render(<PetDetailScreen />);
    expect(queryByText('Archived medications')).toBeNull();
  });

  it('renders the archived medications footer with count when archived meds exist', () => {
    mockArchivedMedsData = [
      {
        id: 'm1',
        pet_id: 'pet-1',
        name: 'Old Med',
        archived_at: '2026-03-01T10:00:00Z',
      },
      {
        id: 'm2',
        pet_id: 'pet-1',
        name: 'Other Old Med',
        archived_at: '2026-02-01T10:00:00Z',
      },
    ];
    const { getByText } = render(<PetDetailScreen />);
    expect(getByText('Archived medications')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
  });

  it('navigates to the archived medications screen when footer is tapped', () => {
    mockArchivedMedsData = [
      {
        id: 'm1',
        pet_id: 'pet-1',
        name: 'Old Med',
        archived_at: '2026-03-01T10:00:00Z',
      },
    ];
    const { getByText } = render(<PetDetailScreen />);
    fireEvent.press(getByText('Archived medications'));
    expect(mockPush).toHaveBeenCalledWith(
      '/(main)/pets/pet-1/health/medication/archived',
    );
  });
});
