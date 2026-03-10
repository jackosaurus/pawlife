import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { HealthSummaryCard } from './HealthSummaryCard';
import { Vaccination } from '@/types';

const makeVaccination = (overrides: Partial<Vaccination> = {}): Vaccination => ({
  id: 'v-1',
  pet_id: 'pet-1',
  vaccine_name: 'Rabies',
  date_administered: '2026-01-15',
  next_due_date: '2027-01-15',
  clinic_name: null,
  created_at: '2026-01-15T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
  ...overrides,
});

describe('HealthSummaryCard', () => {
  describe('empty state', () => {
    it('renders empty state with pet name', () => {
      render(<HealthSummaryCard petName="Beau" />);
      expect(screen.getByText(/Beau's health history/)).toBeTruthy();
    });

    it('renders empty state when vaccinations is empty array', () => {
      render(<HealthSummaryCard petName="Beau" vaccinations={[]} />);
      expect(screen.getByText(/Beau's health history/)).toBeTruthy();
    });

    it('calls onAddRecord when CTA pressed', () => {
      const onAddRecord = jest.fn();
      render(<HealthSummaryCard petName="Beau" onAddRecord={onAddRecord} />);
      fireEvent.press(screen.getByTestId('add-health-record'));
      expect(onAddRecord).toHaveBeenCalledTimes(1);
    });
  });

  describe('populated state', () => {
    it('renders vaccination count', () => {
      const vaccinations = [
        makeVaccination({ id: 'v-1' }),
        makeVaccination({ id: 'v-2' }),
      ];
      render(<HealthSummaryCard petName="Beau" vaccinations={vaccinations} />);
      expect(screen.getByTestId('vaccination-count')).toHaveTextContent('2 vaccinations');
    });

    it('renders singular for one vaccination', () => {
      render(<HealthSummaryCard petName="Beau" vaccinations={[makeVaccination()]} />);
      expect(screen.getByTestId('vaccination-count')).toHaveTextContent('1 vaccination');
    });

    it('shows up to date status when all green', () => {
      const vaccinations = [makeVaccination({ next_due_date: '2028-01-01' })];
      render(<HealthSummaryCard petName="Beau" vaccinations={vaccinations} />);
      expect(screen.getByText('Up to date')).toBeTruthy();
    });

    it('shows overdue status when any overdue', () => {
      const vaccinations = [
        makeVaccination({ id: 'v-1', next_due_date: '2020-01-01' }),
        makeVaccination({ id: 'v-2', next_due_date: '2028-01-01' }),
      ];
      render(<HealthSummaryCard petName="Beau" vaccinations={vaccinations} />);
      expect(screen.getByText('Overdue')).toBeTruthy();
    });

    it('calls onPress when view all records pressed', () => {
      const onPress = jest.fn();
      render(
        <HealthSummaryCard
          petName="Beau"
          vaccinations={[makeVaccination()]}
          onPress={onPress}
        />,
      );
      fireEvent.press(screen.getByTestId('view-health-records'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });
});
