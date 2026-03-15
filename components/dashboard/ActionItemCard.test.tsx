import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ActionItemCard } from './ActionItemCard';
import { ActionItem } from '@/types';
import { Colors } from '@/constants/colors';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

function makeItem(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    id: 'item-1',
    type: 'medication',
    urgency: 'due_today',
    petId: 'pet-1',
    petName: 'Buddy',
    title: 'Heartgard',
    subtitle: 'Due today',
    recordId: 'rec-1',
    medicationId: 'med-1',
    ...overrides,
  };
}

describe('ActionItemCard', () => {
  const defaultProps = {
    onLogDose: jest.fn(),
    onLogVaccination: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and subtitle', () => {
    const item = makeItem();
    render(<ActionItemCard item={item} {...defaultProps} />);

    expect(screen.getByText('Heartgard')).toBeTruthy();
    expect(screen.getByText(/Due today/)).toBeTruthy();
  });

  it('renders vaccination item correctly', () => {
    const item = makeItem({
      type: 'vaccination',
      title: 'Rabies',
      subtitle: 'Due in 7 days',
      medicationId: undefined,
    });
    render(<ActionItemCard item={item} {...defaultProps} />);

    expect(screen.getByText('Rabies')).toBeTruthy();
    expect(screen.getByText(/Due in 7 days/)).toBeTruthy();
  });

  it('shows consistent "Log" action for both types', () => {
    const medItem = makeItem({ type: 'medication' });
    const { unmount } = render(
      <ActionItemCard item={medItem} {...defaultProps} />,
    );
    expect(screen.getByText('Log')).toBeTruthy();
    unmount();

    const vaxItem = makeItem({
      type: 'vaccination',
      medicationId: undefined,
      vaccinationId: 'vax-1',
      intervalMonths: 12,
    });
    render(<ActionItemCard item={vaxItem} {...defaultProps} />);
    expect(screen.getByText('Log')).toBeTruthy();
  });

  it('calls onLogDose with medicationId when Log pressed', () => {
    const onLogDose = jest.fn();
    const item = makeItem({ medicationId: 'med-42' });
    render(
      <ActionItemCard
        item={item}
        onLogDose={onLogDose}
        onLogVaccination={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId('action-button'));
    expect(onLogDose).toHaveBeenCalledWith('med-42');
    expect(onLogDose).toHaveBeenCalledTimes(1);
  });

  it('calls onLogVaccination with vaccinationId and intervalMonths when Log pressed', () => {
    const onLogVaccination = jest.fn();
    const item = makeItem({
      type: 'vaccination',
      medicationId: undefined,
      vaccinationId: 'vax-99',
      intervalMonths: 12,
    });
    render(
      <ActionItemCard
        item={item}
        onLogDose={jest.fn()}
        onLogVaccination={onLogVaccination}
      />,
    );

    fireEvent.press(screen.getByTestId('action-button'));
    expect(onLogVaccination).toHaveBeenCalledWith('vax-99', 12);
    expect(onLogVaccination).toHaveBeenCalledTimes(1);
  });

  it('shows overdue dot color for overdue items', () => {
    const item = makeItem({ urgency: 'overdue' });
    render(<ActionItemCard item={item} {...defaultProps} />);

    const dot = screen.getByTestId('status-dot');
    expect(dot.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: Colors.statusOverdue,
      }),
    );
  });

  it('shows amber dot color for due_today items', () => {
    const item = makeItem({ urgency: 'due_today' });
    render(<ActionItemCard item={item} {...defaultProps} />);

    const dot = screen.getByTestId('status-dot');
    expect(dot.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: Colors.statusAmber,
      }),
    );
  });
});
