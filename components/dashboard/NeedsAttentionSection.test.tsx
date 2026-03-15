import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { NeedsAttentionSection } from './NeedsAttentionSection';
import { ActionItem } from '@/types';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
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

describe('NeedsAttentionSection', () => {
  const defaultProps = {
    onLogDose: jest.fn(),
    onLogVaccination: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when items array is empty', () => {
    const { toJSON } = render(
      <NeedsAttentionSection items={[]} {...defaultProps} />,
    );
    expect(toJSON()).toBeNull();
  });

  it('renders section header with "Needs Attention"', () => {
    const items = [makeItem('1')];
    render(<NeedsAttentionSection items={items} {...defaultProps} />);

    expect(screen.getByText('Needs Attention')).toBeTruthy();
  });

  it('shows count badge with correct number', () => {
    const items = [makeItem('1'), makeItem('2'), makeItem('3')];
    render(<NeedsAttentionSection items={items} {...defaultProps} />);

    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByTestId('count-badge')).toBeTruthy();
  });

  it('groups items by pet with pet name header', () => {
    const items = [
      makeItem('1', { petId: 'p1', petName: 'Buddy', title: 'Heartgard' }),
      makeItem('2', { petId: 'p2', petName: 'Luna', title: 'Apoquel' }),
    ];
    render(<NeedsAttentionSection items={items} {...defaultProps} />);

    const headers = screen.getAllByTestId('pet-group-header');
    expect(headers).toHaveLength(2);
    expect(screen.getByText('Buddy')).toBeTruthy();
    expect(screen.getByText('Luna')).toBeTruthy();
  });

  it('shows inline items when pet has 3 or fewer', () => {
    const items = [
      makeItem('1', { petId: 'p1', petName: 'Buddy', title: 'Med A' }),
      makeItem('2', { petId: 'p1', petName: 'Buddy', title: 'Med B' }),
      makeItem('3', { petId: 'p1', petName: 'Buddy', title: 'Med C' }),
    ];
    render(<NeedsAttentionSection items={items} {...defaultProps} />);

    expect(screen.getAllByTestId('action-item-card')).toHaveLength(3);
    expect(screen.queryByTestId('overflow-link')).toBeNull();
  });

  it('shows overflow summary when pet has more than 3 items', () => {
    const items = [
      makeItem('1', { petId: 'p1', petName: 'Buddy' }),
      makeItem('2', { petId: 'p1', petName: 'Buddy' }),
      makeItem('3', { petId: 'p1', petName: 'Buddy' }),
      makeItem('4', { petId: 'p1', petName: 'Buddy' }),
    ];
    render(<NeedsAttentionSection items={items} {...defaultProps} />);

    expect(screen.queryAllByTestId('action-item-card')).toHaveLength(0);
    expect(screen.getByTestId('overflow-link')).toBeTruthy();
    expect(screen.getByText('4 items need attention')).toBeTruthy();
    expect(screen.getByText('View all')).toBeTruthy();
  });

  it('sorts pet groups by urgency: overdue pets first', () => {
    const items = [
      makeItem('1', {
        petId: 'p1',
        petName: 'Buddy',
        urgency: 'upcoming',
      }),
      makeItem('2', {
        petId: 'p2',
        petName: 'Luna',
        urgency: 'overdue',
      }),
    ];
    render(<NeedsAttentionSection items={items} {...defaultProps} />);

    const headers = screen.getAllByTestId('pet-group-header');
    expect(headers[0].props.children).toBe('Luna');
    expect(headers[1].props.children).toBe('Buddy');
  });
});
