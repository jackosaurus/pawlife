import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
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
    const { getByText } = render(<DeleteConfirmation {...defaultProps} />);
    expect(getByText('Delete Record')).toBeTruthy();
    expect(getByText('Are you sure?')).toBeTruthy();
  });

  it('calls onCancel when cancel is pressed', () => {
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <DeleteConfirmation {...defaultProps} onCancel={onCancel} />,
    );
    fireEvent.press(getByTestId('cancel-button'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when delete is pressed', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <DeleteConfirmation {...defaultProps} onConfirm={onConfirm} />,
    );
    fireEvent.press(getByTestId('confirm-delete-button'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows loading indicator when loading', () => {
    const { getByTestId } = render(
      <DeleteConfirmation {...defaultProps} loading />,
    );
    expect(getByTestId('delete-loading')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <DeleteConfirmation {...defaultProps} visible={false} />,
    );
    expect(queryByText('Delete Record')).toBeNull();
  });
});
