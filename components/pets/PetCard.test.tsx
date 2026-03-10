import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PetCard } from './PetCard';
import { Pet } from '@/types';

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

const mockPet: Pet = {
  id: '1',
  user_id: 'u1',
  pet_type: 'dog',
  name: 'Buddy',
  breed: 'Golden Retriever',
  date_of_birth: null,
  approximate_age_months: 24,
  sex: 'male',
  weight: 30,
  microchip_number: null,
  profile_photo_url: null,
  is_archived: false,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

describe('PetCard', () => {
  it('renders pet name and breed', () => {
    render(<PetCard pet={mockPet} onPress={jest.fn()} />);
    expect(screen.getByText('Buddy')).toBeTruthy();
    expect(screen.getByText('Golden Retriever')).toBeTruthy();
  });

  it('shows age', () => {
    render(<PetCard pet={mockPet} onPress={jest.fn()} />);
    expect(screen.getByText('2 years')).toBeTruthy();
  });

  it('calls onPress', () => {
    const onPress = jest.fn();
    render(<PetCard pet={mockPet} onPress={onPress} />);
    fireEvent.press(screen.getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows Mixed / Unknown when no breed', () => {
    const petNoBreed = { ...mockPet, breed: null };
    render(<PetCard pet={petNoBreed} onPress={jest.fn()} />);
    expect(screen.getByText('Mixed / Unknown')).toBeTruthy();
  });
});
