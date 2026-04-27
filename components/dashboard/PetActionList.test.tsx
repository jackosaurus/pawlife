import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PetActionList } from './PetActionList';
import { ActionItem } from '@/types';

const mockPush = jest.fn();

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

function makeItem(
  id: string,
  overrides: Partial<ActionItem> = {},
): ActionItem {
  return {
    id,
    type: 'medication',
    urgency: 'due_today',
    petId: 'pet-1',
    petName: 'Buddy',
    title: `Med ${id}`,
    subtitle: 'Due today',
    recordId: `rec-${id}`,
    medicationId: `med-${id}`,
    ...overrides,
  };
}

describe('PetActionList', () => {
  const defaultProps = {
    petId: 'pet-1',
    petName: 'Buddy',
    onLogDose: jest.fn(),
    onLogVaccination: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when items array is empty', () => {
    const { toJSON } = render(
      <PetActionList {...defaultProps} items={[]} />,
    );
    expect(toJSON()).toBeNull();
  });

  it('does not render a separate pet-name eyebrow header (vestigial in Option B)', () => {
    render(
      <PetActionList {...defaultProps} items={[makeItem('1')]} />,
    );

    // Pet name lives inline within ActionItemCard ("For Buddy · ...") —
    // no separate eyebrow above the list.
    expect(screen.queryByTestId('pet-group-header')).toBeNull();
  });

  it('renders inline action items when there are 1-3 items', () => {
    const items = [makeItem('1'), makeItem('2'), makeItem('3')];
    render(<PetActionList {...defaultProps} items={items} />);

    expect(screen.getAllByTestId('action-item-card')).toHaveLength(3);
    expect(screen.queryByTestId('overflow-link')).toBeNull();
  });

  it('renders overflow link when there are more than 3 items', () => {
    const items = [makeItem('1'), makeItem('2'), makeItem('3'), makeItem('4')];
    render(<PetActionList {...defaultProps} items={items} />);

    expect(screen.queryAllByTestId('action-item-card')).toHaveLength(0);
    expect(screen.getByTestId('overflow-link')).toBeTruthy();
    expect(screen.getByText('4 items need attention for Buddy')).toBeTruthy();
    expect(screen.getByText('View all')).toBeTruthy();
  });

  it('navigates to pet detail when overflow link tapped', () => {
    const items = [makeItem('1'), makeItem('2'), makeItem('3'), makeItem('4')];
    render(<PetActionList {...defaultProps} petId="pet-42" items={items} />);

    fireEvent.press(screen.getByTestId('overflow-link'));
    expect(mockPush).toHaveBeenCalledWith('/(main)/pets/pet-42');
  });

  it('renders single action item correctly', () => {
    render(
      <PetActionList {...defaultProps} items={[makeItem('1')]} />,
    );

    expect(screen.getByTestId('action-item-card')).toBeTruthy();
    expect(screen.queryByTestId('overflow-link')).toBeNull();
  });
});
