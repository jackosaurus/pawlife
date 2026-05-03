import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StickyHeader } from './StickyHeader';
import { Pet } from '@/types';

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// StickyHeader uses useSafeAreaInsets to extend the textured bg under the
// status bar. Stub the inset values for tests so we don't need to wrap
// every test in a SafeAreaProvider.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));

const mockPet: Pet = {
  id: '1',
  user_id: 'u1',
  pet_type: 'dog',
  name: 'Beau',
  breed: 'Cocker Spaniel',
  date_of_birth: null,
  approximate_age_months: 24,
  sex: 'male',
  weight: 12.5,
  microchip_number: null,
  profile_photo_url: null,
  is_archived: false,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

describe('StickyHeader', () => {
  it('renders pet name and breed', () => {
    render(<StickyHeader pet={mockPet} onBack={jest.fn()} />);
    expect(screen.getByText('Beau')).toBeTruthy();
    expect(screen.getByText('Cocker Spaniel')).toBeTruthy();
  });

  it('shows Mixed / Unknown when breed is null', () => {
    const pet = { ...mockPet, breed: null };
    render(<StickyHeader pet={pet} onBack={jest.fn()} />);
    expect(screen.getByText('Mixed / Unknown')).toBeTruthy();
  });

  it('shows weight when latestWeight is provided', () => {
    render(<StickyHeader pet={mockPet} onBack={jest.fn()} latestWeight={12.5} />);
    expect(screen.getByText('12.5 kg')).toBeTruthy();
  });

  it('does not show weight pill when latestWeight is null', () => {
    render(<StickyHeader pet={mockPet} onBack={jest.fn()} latestWeight={null} />);
    expect(screen.queryByText(/kg/)).toBeNull();
  });

  it('shows age', () => {
    render(<StickyHeader pet={mockPet} onBack={jest.fn()} />);
    expect(screen.getByText('2 years')).toBeTruthy();
  });

  it('calls onBack when back button pressed', () => {
    const onBack = jest.fn();
    render(<StickyHeader pet={mockPet} onBack={onBack} />);
    fireEvent.press(screen.getByTestId('back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('does not render an edit button (header right slot is empty)', () => {
    render(<StickyHeader pet={mockPet} onBack={jest.fn()} />);
    expect(screen.queryByTestId('edit-button')).toBeNull();
    expect(screen.queryByText('Edit')).toBeNull();
  });

it('truncates weight to 1 decimal place', () => {
    render(<StickyHeader pet={mockPet} onBack={jest.fn()} latestWeight={12.222222222111111} />);
    expect(screen.getByText('12.2 kg')).toBeTruthy();
    expect(screen.queryByText(/12\.222/)).toBeNull();
  });

  it('strips trailing zero from whole weight values', () => {
    render(<StickyHeader pet={mockPet} onBack={jest.fn()} latestWeight={10.0} />);
    expect(screen.getByText('10 kg')).toBeTruthy();
  });

  it('renders male sex as metadata pill', () => {
    render(<StickyHeader pet={mockPet} onBack={jest.fn()} />);
    expect(screen.getByText('♂ Male')).toBeTruthy();
  });

  it('renders female sex as metadata pill', () => {
    const pet = { ...mockPet, sex: 'female' as const };
    render(<StickyHeader pet={pet} onBack={jest.fn()} />);
    expect(screen.getByText('♀ Female')).toBeTruthy();
  });

  it('does not show sex pill when sex is null', () => {
    const pet = { ...mockPet, sex: null };
    render(<StickyHeader pet={pet} onBack={jest.fn()} />);
    expect(screen.queryByText(/Male/)).toBeNull();
    expect(screen.queryByText(/Female/)).toBeNull();
  });

  it('renders the smart AgePill when date_of_birth is set', () => {
    const pet = {
      ...mockPet,
      name: 'Luna',
      date_of_birth: '2018-03-14',
      approximate_age_months: null,
    };
    render(<StickyHeader pet={pet} onBack={jest.fn()} />);
    expect(screen.getByTestId('age-pill')).toBeTruthy();
  });

  it('falls back to static MetadataPill when only approximate_age_months is set', () => {
    render(<StickyHeader pet={mockPet} onBack={jest.fn()} />);
    expect(screen.queryByTestId('age-pill')).toBeNull();
    expect(screen.getByText('2 years')).toBeTruthy();
  });
});
