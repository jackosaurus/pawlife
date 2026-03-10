import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { CurrentFoodCard } from './CurrentFoodCard';
import { FoodEntry } from '@/types';

const mockFoodEntry: FoodEntry = {
  id: 'food-1',
  pet_id: 'pet-1',
  brand: 'Blue Buffalo',
  product_name: 'Life Protection',
  food_type: 'dry',
  amount_per_meal: '1 cup',
  meals_per_day: 2,
  start_date: '2026-01-15',
  end_date: null,
  reason_for_change: null,
  notes: null,
  created_at: '2026-01-15T00:00:00Z',
  updated_at: '2026-01-15T00:00:00Z',
};

describe('CurrentFoodCard', () => {
  describe('empty state', () => {
    it('renders empty state with pet name', () => {
      render(<CurrentFoodCard petName="Beau" />);
      expect(screen.getByText(/Beau eating/)).toBeTruthy();
    });

    it('calls onAddFood when CTA pressed', () => {
      const onAddFood = jest.fn();
      render(<CurrentFoodCard petName="Beau" onAddFood={onAddFood} />);
      fireEvent.press(screen.getByTestId('add-food'));
      expect(onAddFood).toHaveBeenCalledTimes(1);
    });

    it('renders empty state when foodEntry is null', () => {
      render(<CurrentFoodCard petName="Beau" foodEntry={null} />);
      expect(screen.getByText(/Beau eating/)).toBeTruthy();
    });
  });

  describe('populated state', () => {
    it('renders food brand name', () => {
      render(<CurrentFoodCard petName="Beau" foodEntry={mockFoodEntry} />);
      expect(screen.getByTestId('food-brand')).toHaveTextContent('Blue Buffalo');
    });

    it('renders product name', () => {
      render(<CurrentFoodCard petName="Beau" foodEntry={mockFoodEntry} />);
      expect(screen.getByText('Life Protection')).toBeTruthy();
    });

    it('renders food type pill', () => {
      render(<CurrentFoodCard petName="Beau" foodEntry={mockFoodEntry} />);
      expect(screen.getByText('Dry')).toBeTruthy();
    });

    it('renders amount per meal', () => {
      render(<CurrentFoodCard petName="Beau" foodEntry={mockFoodEntry} />);
      expect(screen.getByText('1 cup')).toBeTruthy();
    });

    it('renders meals per day', () => {
      render(<CurrentFoodCard petName="Beau" foodEntry={mockFoodEntry} />);
      expect(screen.getByText('2x/day')).toBeTruthy();
    });

    it('calls onChangeFood when pressed', () => {
      const onChangeFood = jest.fn();
      render(
        <CurrentFoodCard
          petName="Beau"
          foodEntry={mockFoodEntry}
          onChangeFood={onChangeFood}
        />,
      );
      fireEvent.press(screen.getByTestId('change-food'));
      expect(onChangeFood).toHaveBeenCalledTimes(1);
    });

    it('does not show change food when callback not provided', () => {
      render(<CurrentFoodCard petName="Beau" foodEntry={mockFoodEntry} />);
      expect(screen.queryByTestId('change-food')).toBeNull();
    });

    it('handles food entry without optional fields', () => {
      const minimalEntry: FoodEntry = {
        ...mockFoodEntry,
        product_name: null,
        food_type: null,
        amount_per_meal: null,
        meals_per_day: null,
      };
      render(<CurrentFoodCard petName="Beau" foodEntry={minimalEntry} />);
      expect(screen.getByTestId('food-brand')).toHaveTextContent('Blue Buffalo');
      expect(screen.queryByText('Dry')).toBeNull();
    });
  });
});
