import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MedicationCard } from './MedicationCard';
import { MedicationWithDoseInfo } from '@/hooks/useMedications';

function makeMed(overrides: Partial<MedicationWithDoseInfo> = {}): MedicationWithDoseInfo {
  return {
    id: '1',
    pet_id: 'p1',
    name: 'Heartgard',
    dosage: '50mg',
    frequency: 'Once monthly',
    start_date: '2025-01-01',
    end_date: null,
    notes: null,
    created_at: '',
    updated_at: '',
    isRecurring: true,
    lastGivenDate: null,
    todayDoseCount: 0,
    dosesPerDay: 1,
    ...overrides,
  };
}

describe('MedicationCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders medication name and subtitle line', () => {
    const med = makeMed();
    const { getByText } = render(
      <MedicationCard medication={med} onPress={jest.fn()} />,
    );
    expect(getByText('Heartgard')).toBeTruthy();
    expect(getByText('50mg · Once monthly')).toBeTruthy();
  });

  it('renders green check indicator when status is green', () => {
    const med = makeMed({
      lastGivenDate: new Date().toISOString(),
      todayDoseCount: 1,
    });
    const { getByTestId } = render(
      <MedicationCard medication={med} onPress={jest.fn()} onLogDose={jest.fn()} />,
    );
    expect(getByTestId('indicator-check')).toBeTruthy();
  });

  it('renders gray dot for never-dosed med', () => {
    const med = makeMed({ lastGivenDate: null });
    const { getByTestId } = render(
      <MedicationCard medication={med} onPress={jest.fn()} onLogDose={jest.fn()} />,
    );
    expect(getByTestId('indicator-dot')).toBeTruthy();
  });

  it('renders fraction indicator for partial multi-daily', () => {
    const med = makeMed({
      frequency: 'Twice daily',
      dosesPerDay: 2,
      todayDoseCount: 1,
      lastGivenDate: new Date().toISOString(),
    });
    const { getByTestId, getByText } = render(
      <MedicationCard medication={med} onPress={jest.fn()} onLogDose={jest.fn()} />,
    );
    expect(getByTestId('indicator-fraction')).toBeTruthy();
    expect(getByText('1/2')).toBeTruthy();
  });

  it('shows Log Dose when status is not green', () => {
    const med = makeMed({ lastGivenDate: null });
    const { getByTestId } = render(
      <MedicationCard medication={med} onPress={jest.fn()} onLogDose={jest.fn()} />,
    );
    expect(getByTestId('log-dose-button')).toBeTruthy();
  });

  it('hides Log Dose when status is green', () => {
    const med = makeMed({
      lastGivenDate: new Date().toISOString(),
      todayDoseCount: 1,
    });
    const { queryByTestId } = render(
      <MedicationCard medication={med} onPress={jest.fn()} onLogDose={jest.fn()} />,
    );
    expect(queryByTestId('log-dose-button')).toBeNull();
  });

  it('shows Log Dose for "As needed" even when green', () => {
    const med = makeMed({
      frequency: 'As needed',
      dosesPerDay: null,
      lastGivenDate: new Date().toISOString(),
    });
    const { getByTestId } = render(
      <MedicationCard medication={med} onPress={jest.fn()} onLogDose={jest.fn()} />,
    );
    expect(getByTestId('log-dose-button')).toBeTruthy();
  });

  it('calls onLogDose when Log Dose is pressed', () => {
    const onLogDose = jest.fn();
    const med = makeMed({ lastGivenDate: null });
    const { getByTestId } = render(
      <MedicationCard medication={med} onPress={jest.fn()} onLogDose={onLogDose} />,
    );
    fireEvent.press(getByTestId('log-dose-button'));
    expect(onLogDose).toHaveBeenCalledTimes(1);
  });

  it('calls onPress when card is pressed', () => {
    const onPress = jest.fn();
    const med = makeMed();
    const { getByTestId } = render(
      <MedicationCard medication={med} onPress={onPress} onLogDose={jest.fn()} />,
    );
    fireEvent.press(getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows context text', () => {
    const med = makeMed({ lastGivenDate: null });
    const { getByText } = render(
      <MedicationCard medication={med} onPress={jest.fn()} onLogDose={jest.fn()} />,
    );
    expect(getByText('No doses logged')).toBeTruthy();
  });

  it('hides Log Dose for finished med', () => {
    const med = makeMed({ end_date: '2020-01-01' });
    const { queryByTestId, getByText } = render(
      <MedicationCard medication={med} onPress={jest.fn()} onLogDose={jest.fn()} />,
    );
    expect(queryByTestId('log-dose-button')).toBeNull();
    expect(getByText('Finished')).toBeTruthy();
  });
});
