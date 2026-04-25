import React from 'react';
import { Alert } from 'react-native';
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
    is_archived: false,
    archived_at: null,
    created_at: '',
    updated_at: '',
    isRecurring: true,
    lastGivenDate: null,
    todayDoseCount: 0,
    dosesPerDay: 1,
    ...overrides,
  } as MedicationWithDoseInfo;
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

  describe('stale prompt', () => {
    it('renders end_date_passed prompt for med with past end_date', () => {
      const med = makeMed({ end_date: '2020-01-01' });
      const { getByTestId } = render(
        <MedicationCard
          medication={med}
          onPress={jest.fn()}
          onArchive={jest.fn()}
        />,
      );
      const prompt = getByTestId('stale-prompt');
      expect(prompt).toBeTruthy();
    });

    it('renders no_recent_doses prompt for daily med with no recent doses', () => {
      // Last dose 60 days ago, frequency Once daily → stale (>30d)
      const old = new Date();
      old.setDate(old.getDate() - 60);
      const med = makeMed({
        frequency: 'Once daily',
        dosesPerDay: 1,
        lastGivenDate: old.toISOString(),
      });
      const { getByTestId } = render(
        <MedicationCard
          medication={med}
          onPress={jest.fn()}
          onArchive={jest.fn()}
        />,
      );
      expect(getByTestId('stale-prompt')).toBeTruthy();
    });

    it('does not render prompt when not stale', () => {
      const med = makeMed({
        frequency: 'Once daily',
        dosesPerDay: 1,
        lastGivenDate: new Date().toISOString(),
      });
      const { queryByTestId } = render(
        <MedicationCard
          medication={med}
          onPress={jest.fn()}
          onArchive={jest.fn()}
        />,
      );
      expect(queryByTestId('stale-prompt')).toBeNull();
    });

    it('opens Alert.alert with archive confirmation when prompt is tapped', () => {
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const onArchive = jest.fn();
      const med = makeMed({ end_date: '2020-01-01' });
      const { getByTestId } = render(
        <MedicationCard
          medication={med}
          onPress={jest.fn()}
          onArchive={onArchive}
        />,
      );
      fireEvent.press(getByTestId('stale-prompt'));
      expect(alertSpy).toHaveBeenCalledTimes(1);
      const [title, message, buttons] = alertSpy.mock.calls[0];
      expect(title).toBe('Archive medication?');
      expect(message).toContain('Heartgard');
      expect(message?.toLowerCase()).toContain('archive');
      expect(buttons).toHaveLength(2);
      // Simulate pressing the "Archive" button
      const archiveButton = (buttons as Array<{ text: string; onPress?: () => void }>).find(
        (b) => b.text === 'Archive',
      );
      archiveButton?.onPress?.();
      expect(onArchive).toHaveBeenCalledTimes(1);
      alertSpy.mockRestore();
    });

    it('does not crash if onArchive is omitted when prompt is tapped', () => {
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      const med = makeMed({ end_date: '2020-01-01' });
      const { getByTestId } = render(
        <MedicationCard medication={med} onPress={jest.fn()} />,
      );
      fireEvent.press(getByTestId('stale-prompt'));
      // No alert should be shown without an onArchive handler
      expect(alertSpy).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });
  });
});
