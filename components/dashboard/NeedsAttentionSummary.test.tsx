import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { NeedsAttentionSummary } from './NeedsAttentionSummary';
import { ActionItem } from '@/types';
import { Colors } from '@/constants/colors';

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

describe('NeedsAttentionSummary', () => {
  it('returns null when items array is empty', () => {
    const { toJSON } = render(<NeedsAttentionSummary items={[]} />);
    expect(toJSON()).toBeNull();
  });

  it('renders singular label when there is one item', () => {
    render(<NeedsAttentionSummary items={[makeItem('1')]} />);
    expect(screen.getByText('1 item needs attention')).toBeTruthy();
  });

  it('renders plural label with count when there are multiple items', () => {
    const items = [makeItem('1'), makeItem('2'), makeItem('3')];
    render(<NeedsAttentionSummary items={items} />);
    expect(screen.getByText('3 items need attention')).toBeTruthy();
  });

  it('uses overdue color when any item is overdue', () => {
    const items = [
      makeItem('1', { urgency: 'upcoming' }),
      makeItem('2', { urgency: 'overdue' }),
      makeItem('3', { urgency: 'due_today' }),
    ];
    render(<NeedsAttentionSummary items={items} />);

    const dot = screen.getByTestId('needs-attention-summary-dot');
    expect(dot.props.style).toEqual(
      expect.objectContaining({ backgroundColor: Colors.statusOverdue }),
    );
  });

  it('uses amber color when due_today but no overdue', () => {
    const items = [
      makeItem('1', { urgency: 'upcoming' }),
      makeItem('2', { urgency: 'due_today' }),
    ];
    render(<NeedsAttentionSummary items={items} />);

    const dot = screen.getByTestId('needs-attention-summary-dot');
    expect(dot.props.style).toEqual(
      expect.objectContaining({ backgroundColor: Colors.statusAmber }),
    );
  });

  it('uses neutral color when only upcoming items', () => {
    const items = [
      makeItem('1', { urgency: 'upcoming' }),
      makeItem('2', { urgency: 'upcoming' }),
    ];
    render(<NeedsAttentionSummary items={items} />);

    const dot = screen.getByTestId('needs-attention-summary-dot');
    expect(dot.props.style).toEqual(
      expect.objectContaining({ backgroundColor: Colors.statusNeutral }),
    );
  });

  it('renders the summary container with testID', () => {
    render(<NeedsAttentionSummary items={[makeItem('1')]} />);
    expect(screen.getByTestId('needs-attention-summary')).toBeTruthy();
  });
});
