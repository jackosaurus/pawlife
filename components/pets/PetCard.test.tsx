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

/**
 * Build a pet with a precise dob so the smart age (`useAgeMoment`) path
 * runs. Tests that exercise specific phases pin `Date.now` via fake timers.
 */
function petWithDob(dob: string): Pet {
  return { ...mockPet, date_of_birth: dob, approximate_age_months: null };
}

describe('PetCard', () => {
  it('renders pet name and breed', () => {
    render(<PetCard pet={mockPet} onPress={jest.fn()} />);
    expect(screen.getByText('Buddy')).toBeTruthy();
    expect(screen.getByText('Golden Retriever')).toBeTruthy();
  });

  it('falls back to calculateAge when there is no date_of_birth', () => {
    render(<PetCard pet={mockPet} onPress={jest.fn()} />);
    // approximate_age_months: 24 → "2 years"
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

  /**
   * Smart age states on the dashboard. All four phases use the name-less
   * `shortLabel` from `useAgeMoment` (the card heading already shows the
   * pet name — repeating it would be redundant).
   */
  describe('smart age (date_of_birth present)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('default phase: "{N} years old", no name', () => {
      jest.setSystemTime(new Date(2026, 5, 15, 9, 0, 0));
      render(
        <PetCard pet={petWithDob('2018-03-14T00:00:00')} onPress={jest.fn()} />,
      );
      expect(screen.getByText('8 years old')).toBeTruthy();
      // The pet name should appear exactly once — as the heading, not in
      // the age line.
      expect(screen.getAllByText(/Buddy/).length).toBe(1);
    });

    it('birthday phase: "🎂 {N} today" with accent color', () => {
      jest.setSystemTime(new Date(2026, 2, 14, 9, 0, 0));
      render(
        <PetCard pet={petWithDob('2017-03-14T00:00:00')} onPress={jest.fn()} />,
      );
      const ageNode = screen.getByTestId('pet-card-age');
      expect(ageNode.props.children).toBe('🎂 9 today');
      // Festive line uses accent color, not the secondary gray.
      expect(ageNode.props.className).toContain('text-accent');
      expect(ageNode.props.className).not.toContain('text-text-secondary');
    });

    it('savor phase: "Just turned {N}", no festive color', () => {
      jest.setSystemTime(new Date(2026, 2, 15, 9, 0, 0));
      render(
        <PetCard pet={petWithDob('2017-03-14T00:00:00')} onPress={jest.fn()} />,
      );
      const ageNode = screen.getByTestId('pet-card-age');
      expect(ageNode.props.children).toBe('Just turned 9');
      expect(ageNode.props.className).toContain('text-text-secondary');
      expect(ageNode.props.className).not.toContain('text-accent');
    });

    it('puppy phase: months copy, no name', () => {
      jest.setSystemTime(new Date(2026, 4, 1, 9, 0, 0));
      render(
        <PetCard pet={petWithDob('2026-01-01T00:00:00')} onPress={jest.fn()} />,
      );
      expect(screen.getByText('4 months old')).toBeTruthy();
    });
  });
});
