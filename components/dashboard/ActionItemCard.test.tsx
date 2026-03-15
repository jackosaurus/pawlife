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
    subtitle: '50mg - Due today',
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

  it('renders medication item with correct pet name and title', () => {
    const item = makeItem();
    render(<ActionItemCard item={item} {...defaultProps} />);

    expect(screen.getByText('Buddy')).toBeTruthy();
    expect(screen.getByText('Heartgard')).toBeTruthy();
    expect(screen.getByText('50mg - Due today')).toBeTruthy();
  });

  it('renders vaccination item correctly', () => {
    const item = makeItem({
      type: 'vaccination',
      title: 'Rabies',
      subtitle: 'Due 20 Mar 2026',
      petName: 'Luna',
      medicationId: undefined,
    });
    render(<ActionItemCard item={item} {...defaultProps} />);

    expect(screen.getByText('Luna')).toBeTruthy();
    expect(screen.getByText('Rabies')).toBeTruthy();
    expect(screen.getByText('Due 20 Mar 2026')).toBeTruthy();
  });

  it('shows "Log Dose" action for medication items', () => {
    const item = makeItem({ type: 'medication' });
    render(<ActionItemCard item={item} {...defaultProps} />);

    expect(screen.getByText('Log Dose')).toBeTruthy();
  });

  it('shows "Log" action for vaccination items', () => {
    const item = makeItem({ type: 'vaccination', medicationId: undefined, vaccinationId: 'vax-1', intervalMonths: 12 });
    render(<ActionItemCard item={item} {...defaultProps} />);

    expect(screen.getByText('Log')).toBeTruthy();
  });

  it('calls onLogDose with medicationId when Log Dose pressed', () => {
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
      petId: 'pet-7',
      recordId: 'vax-99',
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

  it('shows overdue styling (left border color) for overdue items', () => {
    const item = makeItem({ urgency: 'overdue' });
    render(<ActionItemCard item={item} {...defaultProps} />);

    const card = screen.getByTestId('action-item-card');
    expect(card.props.style).toEqual(
      expect.objectContaining({
        borderLeftWidth: 3,
        borderLeftColor: Colors.statusOverdue,
      }),
    );
  });

  it('shows amber styling for due_today items', () => {
    const item = makeItem({ urgency: 'due_today' });
    render(<ActionItemCard item={item} {...defaultProps} />);

    const card = screen.getByTestId('action-item-card');
    expect(card.props.style).toEqual(
      expect.objectContaining({
        borderLeftWidth: 3,
        borderLeftColor: Colors.statusAmber,
      }),
    );
  });
});
