import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RecordCard } from './RecordCard';

describe('RecordCard', () => {
  const defaultProps = {
    title: 'Rabies',
    date: '2025-01-15',
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and formatted date', () => {
    const { getByText } = render(<RecordCard {...defaultProps} />);
    expect(getByText('Rabies')).toBeTruthy();
    expect(getByText('Jan 15, 2025')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    const { getByText } = render(
      <RecordCard {...defaultProps} subtitle="Happy Paws Vet" />,
    );
    expect(getByText('Happy Paws Vet')).toBeTruthy();
  });

  it('does not render subtitle when not provided', () => {
    const { queryByText } = render(<RecordCard {...defaultProps} />);
    expect(queryByText('Happy Paws Vet')).toBeNull();
  });

  it('renders status pill when status and statusLabel provided', () => {
    const { getByText } = render(
      <RecordCard
        {...defaultProps}
        status="green"
        statusLabel="Up to date"
      />,
    );
    expect(getByText('Up to date')).toBeTruthy();
  });

  it('does not render status pill when status is missing', () => {
    const { queryByText } = render(<RecordCard {...defaultProps} />);
    expect(queryByText('Up to date')).toBeNull();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <RecordCard {...defaultProps} onPress={onPress} />,
    );
    fireEvent.press(getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
