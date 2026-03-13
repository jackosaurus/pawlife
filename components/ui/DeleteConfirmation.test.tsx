import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { DeleteConfirmation } from './DeleteConfirmation';

describe('DeleteConfirmation', () => {
  const defaultProps = {
    visible: true,
    title: 'Delete Record',
    message: 'Are you sure?',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and message when visible', () => {
    render(<DeleteConfirmation {...defaultProps} />);
    expect(screen.getByText('Delete Record')).toBeTruthy();
    expect(screen.getByText('Are you sure?')).toBeTruthy();
  });

  it('renders delete and cancel buttons', () => {
    render(<DeleteConfirmation {...defaultProps} />);
    expect(screen.getByText('Delete')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('calls onCancel when cancel is pressed', () => {
    const onCancel = jest.fn();
    render(<DeleteConfirmation {...defaultProps} onCancel={onCancel} />);
    fireEvent.press(screen.getByTestId('cancel-button'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when delete is pressed', () => {
    const onConfirm = jest.fn();
    render(<DeleteConfirmation {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.press(screen.getByTestId('confirm-delete-button'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows loading indicator when loading', () => {
    render(<DeleteConfirmation {...defaultProps} loading />);
    expect(screen.getByTestId('delete-loading')).toBeTruthy();
    expect(screen.queryByText('Delete')).toBeNull();
  });

  it('calls onCancel when backdrop is pressed', () => {
    const onCancel = jest.fn();
    render(<DeleteConfirmation {...defaultProps} onCancel={onCancel} />);
    fireEvent.press(screen.getByTestId('backdrop'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not render content when not visible', () => {
    render(<DeleteConfirmation {...defaultProps} visible={false} />);
    expect(screen.queryByText('Delete Record')).toBeNull();
  });
});
