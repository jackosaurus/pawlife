import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react-native';
import { ConfirmationModal } from './ConfirmationModal';
import { Colors } from '@/constants/colors';

describe('ConfirmationModal', () => {
  const baseProps = {
    visible: true,
    title: 'Delete Record',
    message: 'This will permanently remove the record.',
    confirmLabel: 'Delete',
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title, message, confirm and cancel buttons', () => {
    render(<ConfirmationModal {...baseProps} />);
    expect(screen.getByText('Delete Record')).toBeTruthy();
    expect(screen.getByText('This will permanently remove the record.')).toBeTruthy();
    expect(screen.getByText('Delete')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('uses custom cancelLabel when provided', () => {
    render(<ConfirmationModal {...baseProps} cancelLabel="Nevermind" />);
    expect(screen.getByText('Nevermind')).toBeTruthy();
  });

  it('does not render content when not visible', () => {
    render(<ConfirmationModal {...baseProps} visible={false} />);
    expect(screen.queryByText('Delete Record')).toBeNull();
  });

  it('calls onConfirm when confirm pressed', () => {
    const onConfirm = jest.fn();
    render(<ConfirmationModal {...baseProps} onConfirm={onConfirm} />);
    fireEvent.press(screen.getByTestId('confirm-button'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel pressed', () => {
    const onCancel = jest.fn();
    render(<ConfirmationModal {...baseProps} onCancel={onCancel} />);
    fireEvent.press(screen.getByTestId('cancel-button'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when backdrop pressed', () => {
    const onCancel = jest.fn();
    render(<ConfirmationModal {...baseProps} onCancel={onCancel} />);
    fireEvent.press(screen.getByTestId('backdrop'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows loading indicator on confirm when loading', () => {
    render(<ConfirmationModal {...baseProps} loading />);
    expect(screen.getByTestId('confirm-loading')).toBeTruthy();
  });

  it('blocks backdrop press while loading', () => {
    const onCancel = jest.fn();
    render(<ConfirmationModal {...baseProps} loading onCancel={onCancel} />);
    fireEvent.press(screen.getByTestId('backdrop'));
    expect(onCancel).not.toHaveBeenCalled();
  });

  describe('severity=standard', () => {
    it('confirm button uses neutral text color', () => {
      render(<ConfirmationModal {...baseProps} severity="standard" />);
      const confirmText = screen.getByText('Delete');
      const style = Array.isArray(confirmText.props.style)
        ? Object.assign({}, ...confirmText.props.style)
        : confirmText.props.style;
      expect(style.color).toBe(Colors.textPrimary);
    });
  });

  describe('severity=destructive', () => {
    it('confirm button uses destructive color', () => {
      render(<ConfirmationModal {...baseProps} severity="destructive" />);
      const confirmText = screen.getByText('Delete');
      const style = Array.isArray(confirmText.props.style)
        ? Object.assign({}, ...confirmText.props.style)
        : confirmText.props.style;
      expect(style.color).toBe(Colors.destructive);
    });
  });

  describe('severity=irreversible', () => {
    const irrevProps = {
      ...baseProps,
      severity: 'irreversible' as const,
      typedConfirmationWord: 'DELETE',
    };

    it('renders the typed confirmation input', () => {
      render(<ConfirmationModal {...irrevProps} />);
      expect(screen.getByTestId('typed-confirmation-input')).toBeTruthy();
    });

    it('disables confirm button until typed word matches', () => {
      const onConfirm = jest.fn();
      render(<ConfirmationModal {...irrevProps} onConfirm={onConfirm} />);
      // Initially disabled
      fireEvent.press(screen.getByTestId('confirm-button'));
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('enables confirm button when typed word matches exactly', () => {
      const onConfirm = jest.fn();
      render(<ConfirmationModal {...irrevProps} onConfirm={onConfirm} />);
      act(() => {
        fireEvent.changeText(screen.getByTestId('typed-confirmation-input'), 'DELETE');
      });
      fireEvent.press(screen.getByTestId('confirm-button'));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('treats typed word as case-sensitive', () => {
      const onConfirm = jest.fn();
      render(<ConfirmationModal {...irrevProps} onConfirm={onConfirm} />);
      act(() => {
        fireEvent.changeText(screen.getByTestId('typed-confirmation-input'), 'delete');
      });
      fireEvent.press(screen.getByTestId('confirm-button'));
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('uses filled destructive background for confirm button', () => {
      render(<ConfirmationModal {...irrevProps} />);
      const button = screen.getByTestId('confirm-button');
      const style = Array.isArray(button.props.style)
        ? Object.assign({}, ...button.props.style)
        : button.props.style;
      expect(style.backgroundColor).toBe(Colors.destructive);
    });

    it('resets typed value when modal closes and reopens', () => {
      const { rerender } = render(<ConfirmationModal {...irrevProps} />);
      act(() => {
        fireEvent.changeText(
          screen.getByTestId('typed-confirmation-input'),
          'DELETE',
        );
      });
      // Close
      rerender(<ConfirmationModal {...irrevProps} visible={false} />);
      // Reopen
      rerender(<ConfirmationModal {...irrevProps} visible={true} />);
      const input = screen.getByTestId('typed-confirmation-input');
      expect(input.props.value).toBe('');
    });
  });
});
