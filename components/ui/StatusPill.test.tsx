import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StatusPill } from './StatusPill';

describe('StatusPill', () => {
  it('renders label for green status', () => {
    render(<StatusPill label="Current" status="green" />);
    expect(screen.getByText('Current')).toBeTruthy();
    expect(screen.getByTestId('status-pill-green')).toBeTruthy();
  });

  it('renders label for amber status', () => {
    render(<StatusPill label="Due Soon" status="amber" />);
    expect(screen.getByText('Due Soon')).toBeTruthy();
    expect(screen.getByTestId('status-pill-amber')).toBeTruthy();
  });

  it('renders label for overdue status', () => {
    render(<StatusPill label="Overdue" status="overdue" />);
    expect(screen.getByText('Overdue')).toBeTruthy();
    expect(screen.getByTestId('status-pill-overdue')).toBeTruthy();
  });
});
