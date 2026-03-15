import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { NeedsAttentionSection } from './NeedsAttentionSection';
import { ActionItem } from '@/types';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
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

function makeItems(count: number): ActionItem[] {
  return Array.from({ length: count }, (_, i) => makeItem(String(i + 1)));
}

describe('NeedsAttentionSection', () => {
  const defaultProps = {
    onLogDose: jest.fn(),
    onViewVaccination: jest.fn(),
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
    const items = makeItems(3);
    render(<NeedsAttentionSection items={items} {...defaultProps} />);

    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByTestId('count-badge')).toBeTruthy();
  });

  it('renders action item cards', () => {
    const items = [
      makeItem('1', { title: 'Heartgard' }),
      makeItem('2', { title: 'Apoquel' }),
    ];
    render(<NeedsAttentionSection items={items} {...defaultProps} />);

    expect(screen.getByText('Heartgard')).toBeTruthy();
    expect(screen.getByText('Apoquel')).toBeTruthy();
  });

  it('shows only 5 items when more than 5 exist', () => {
    const items = makeItems(7);
    render(<NeedsAttentionSection items={items} {...defaultProps} />);

    // Should render exactly 5 action item cards
    const cards = screen.getAllByTestId('action-item-card');
    expect(cards).toHaveLength(5);
  });

  it('shows "Show all" button when more than 5 items', () => {
    const items = makeItems(8);
    render(<NeedsAttentionSection items={items} {...defaultProps} />);

    expect(screen.getByText('Show all (8)')).toBeTruthy();
  });

  it('expands to show all items when "Show all" pressed', () => {
    const items = makeItems(7);
    render(<NeedsAttentionSection items={items} {...defaultProps} />);

    // Initially 5
    expect(screen.getAllByTestId('action-item-card')).toHaveLength(5);

    // Press toggle
    fireEvent.press(screen.getByTestId('toggle-button'));

    // Now all 7
    expect(screen.getAllByTestId('action-item-card')).toHaveLength(7);
  });

  it('shows "Show less" after expanding', () => {
    const items = makeItems(6);
    render(<NeedsAttentionSection items={items} {...defaultProps} />);

    fireEvent.press(screen.getByTestId('toggle-button'));

    expect(screen.getByText('Show less')).toBeTruthy();
  });
});
