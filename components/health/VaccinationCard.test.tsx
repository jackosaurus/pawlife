import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VaccinationCard } from './VaccinationCard';
import { Vaccination } from '@/types';
import { getVaccinationStatus } from '@/utils/status';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('@/utils/status', () => ({
  getVaccinationStatus: jest.fn(),
}));

const mockedGetVaccinationStatus = getVaccinationStatus as jest.MockedFunction<
  typeof getVaccinationStatus
>;

const makeVaccination = (overrides: Partial<Vaccination> = {}): Vaccination => ({
  id: 'v1',
  pet_id: 'p1',
  vaccine_name: 'Rabies',
  date_administered: '2025-01-15',
  next_due_date: '2026-01-15',
  interval_months: 12,
  clinic_name: null,
  created_by: null,
  modified_by: null,
  created_at: '2025-01-15T00:00:00Z',
  updated_at: '2025-01-15T00:00:00Z',
  ...overrides,
});

describe('VaccinationCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetVaccinationStatus.mockReturnValue('green');
  });

  it('renders vaccine name and interval label', () => {
    const vaccination = makeVaccination();
    const { getByText } = render(
      <VaccinationCard vaccination={vaccination} onPress={jest.fn()} />,
    );
    expect(getByText('Rabies')).toBeTruthy();
    expect(getByText('Every year')).toBeTruthy();
  });

  it('shows green check indicator when up to date', () => {
    mockedGetVaccinationStatus.mockReturnValue('green');
    const vaccination = makeVaccination();
    const { getByTestId } = render(
      <VaccinationCard vaccination={vaccination} onPress={jest.fn()} />,
    );
    expect(getByTestId('indicator-check')).toBeTruthy();
  });

  it('shows amber dot when due soon', () => {
    mockedGetVaccinationStatus.mockReturnValue('amber');
    const vaccination = makeVaccination();
    const { getByTestId, getByText } = render(
      <VaccinationCard vaccination={vaccination} onPress={jest.fn()} />,
    );
    expect(getByTestId('indicator-dot')).toBeTruthy();
    expect(getByText('Due soon')).toBeTruthy();
  });

  it('shows red dot when overdue', () => {
    mockedGetVaccinationStatus.mockReturnValue('overdue');
    const vaccination = makeVaccination();
    const { getByTestId, getByText } = render(
      <VaccinationCard vaccination={vaccination} onPress={jest.fn()} />,
    );
    expect(getByTestId('indicator-dot')).toBeTruthy();
    expect(getByText('Overdue')).toBeTruthy();
  });

  it('shows gray dot when never administered', () => {
    mockedGetVaccinationStatus.mockReturnValue('green');
    const vaccination = makeVaccination({
      date_administered: null as unknown as string,
    });
    const { getByTestId, getByText } = render(
      <VaccinationCard vaccination={vaccination} onPress={jest.fn()} />,
    );
    expect(getByTestId('indicator-dot')).toBeTruthy();
    expect(getByText('Not yet given')).toBeTruthy();
  });

  it('shows Log button when status is not green', () => {
    mockedGetVaccinationStatus.mockReturnValue('amber');
    const vaccination = makeVaccination();
    const { getByTestId } = render(
      <VaccinationCard
        vaccination={vaccination}
        onPress={jest.fn()}
        onLog={jest.fn()}
      />,
    );
    expect(getByTestId('log-button')).toBeTruthy();
  });

  it('hides Log button when status is green', () => {
    mockedGetVaccinationStatus.mockReturnValue('green');
    const vaccination = makeVaccination();
    const { queryByTestId } = render(
      <VaccinationCard
        vaccination={vaccination}
        onPress={jest.fn()}
        onLog={jest.fn()}
      />,
    );
    expect(queryByTestId('log-button')).toBeNull();
  });

  it('calls onLog when Log is pressed', () => {
    mockedGetVaccinationStatus.mockReturnValue('overdue');
    const onLog = jest.fn();
    const vaccination = makeVaccination();
    const { getByTestId } = render(
      <VaccinationCard
        vaccination={vaccination}
        onPress={jest.fn()}
        onLog={onLog}
      />,
    );
    fireEvent.press(getByTestId('log-button'));
    expect(onLog).toHaveBeenCalledTimes(1);
  });

  it('calls onPress when card is pressed', () => {
    const onPress = jest.fn();
    const vaccination = makeVaccination();
    const { getByTestId } = render(
      <VaccinationCard vaccination={vaccination} onPress={onPress} />,
    );
    fireEvent.press(getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading indicator when logLoading is true', () => {
    mockedGetVaccinationStatus.mockReturnValue('overdue');
    const vaccination = makeVaccination();
    const { getByTestId, queryByText } = render(
      <VaccinationCard
        vaccination={vaccination}
        onPress={jest.fn()}
        onLog={jest.fn()}
        logLoading
      />,
    );
    // The log button should exist but show a spinner instead of text
    expect(getByTestId('log-button')).toBeTruthy();
    expect(queryByText('Log')).toBeNull();
  });

  /**
   * Regression: status indicator must sit in an absolute-positioned slot at
   * the same top-right offset across all card variants. This prevents the
   * vertical drift the user spotted on real-device builds when cards in a
   * list have different right-column content (with vs without Log button,
   * different indicator types, different left-column lengths).
   */
  describe('layout invariant — status indicator anchor', () => {
    function getSlotStyle(node: { props: { style: unknown } }) {
      const raw = node.props.style;
      return Array.isArray(raw)
        ? Object.assign({}, ...(raw as object[]))
        : (raw as Record<string, unknown>);
    }

    it('anchors the indicator slot at top:0 right:0 regardless of variant', () => {
      mockedGetVaccinationStatus.mockReturnValue('green');
      const greenCheck = render(
        <VaccinationCard vaccination={makeVaccination()} onPress={jest.fn()} />,
      );

      mockedGetVaccinationStatus.mockReturnValue('amber');
      const amberWithLog = render(
        <VaccinationCard
          vaccination={makeVaccination({ vaccine_name: 'Cytopoint' })}
          onPress={jest.fn()}
          onLog={jest.fn()}
        />,
      );

      mockedGetVaccinationStatus.mockReturnValue('overdue');
      const overdueLong = render(
        <VaccinationCard
          vaccination={makeVaccination({
            vaccine_name: 'Some Extremely Long Vaccine Name That Truncates',
          })}
          onPress={jest.fn()}
          onLog={jest.fn()}
        />,
      );

      const a = getSlotStyle(greenCheck.getByTestId('status-indicator-slot'));
      const b = getSlotStyle(amberWithLog.getByTestId('status-indicator-slot'));
      const c = getSlotStyle(overdueLong.getByTestId('status-indicator-slot'));

      for (const style of [a, b, c]) {
        expect(style.position).toBe('absolute');
        expect(style.top).toBe(0);
        expect(style.right).toBe(0);
      }
      // And dimensions match — same slot, same place, every time.
      expect(a.width).toBe(b.width);
      expect(b.width).toBe(c.width);
      expect(a.height).toBe(b.height);
      expect(b.height).toBe(c.height);
    });
  });
});
