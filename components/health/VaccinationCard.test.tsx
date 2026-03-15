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
});
