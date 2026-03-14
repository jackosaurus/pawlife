import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StickyHeader } from './StickyHeader';
import { Pet } from '@/types';

jest.mock('expo-image', () => ({
  Image: 'Image',
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

  it('renders edit button as pill and calls onEdit when pressed', () => {
    const onEdit = jest.fn();
    render(<StickyHeader pet={mockPet} onBack={jest.fn()} onEdit={onEdit} />);
    const editButton = screen.getByTestId('edit-button');
    expect(screen.getByText('Edit')).toBeTruthy();
    fireEvent.press(editButton);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('does not render edit button when onEdit not provided', () => {
    render(<StickyHeader pet={mockPet} onBack={jest.fn()} />);
    expect(screen.queryByTestId('edit-button')).toBeNull();
    expect(screen.queryByText('Edit')).toBeNull();
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
});
