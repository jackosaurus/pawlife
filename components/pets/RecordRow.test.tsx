import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RecordRow } from './RecordRow';

describe('RecordRow', () => {
  const defaultProps = {
    title: 'Rabies',
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title', () => {
    render(<RecordRow {...defaultProps} />);
    expect(screen.getByText('Rabies')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    render(<RecordRow {...defaultProps} subtitle="Happy Paws Vet" />);
    expect(screen.getByText('Happy Paws Vet')).toBeTruthy();
  });

  it('renders trailing text when provided', () => {
    render(<RecordRow {...defaultProps} trailing="Jan 15, 2025" />);
    expect(screen.getByText('Jan 15, 2025')).toBeTruthy();
  });

  it('renders status pill when status and label provided', () => {
    render(
      <RecordRow {...defaultProps} status="green" statusLabel="Up to date" />,
    );
    expect(screen.getByText('Up to date')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    render(<RecordRow {...defaultProps} />);
    fireEvent.press(screen.getByTestId('record-row'));
    expect(defaultProps.onPress).toHaveBeenCalledTimes(1);
  });

  it('does not show status pill without both status and label', () => {
    render(<RecordRow {...defaultProps} status="green" />);
    expect(screen.queryByTestId('status-pill-green')).toBeNull();
  });
});
