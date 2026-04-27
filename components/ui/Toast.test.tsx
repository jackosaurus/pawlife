import React from 'react';
import { Pressable, Text } from 'react-native';
import {
  render,
  screen,
  fireEvent,
  act,
} from '@testing-library/react-native';
import { ToastProvider, useToast } from './Toast';

function TriggerButton({ message }: { message: string }) {
  const { show } = useToast();
  return (
    <Pressable onPress={() => show(message)} testID="trigger">
      <Text>show</Text>
    </Pressable>
  );
}

describe('Toast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('does not render the toast initially', () => {
    render(
      <ToastProvider>
        <TriggerButton message="Hello" />
      </ToastProvider>,
    );
    expect(screen.queryByTestId('toast')).toBeNull();
  });

  it('shows the toast when show() is called', () => {
    render(
      <ToastProvider>
        <TriggerButton message="Luna restored" />
      </ToastProvider>,
    );
    act(() => {
      fireEvent.press(screen.getByTestId('trigger'));
    });
    expect(screen.getByTestId('toast')).toBeTruthy();
    expect(screen.getByText('Luna restored')).toBeTruthy();
  });

  it('auto-dismisses after the duration', () => {
    render(
      <ToastProvider>
        <TriggerButton message="Luna restored" />
      </ToastProvider>,
    );
    act(() => {
      fireEvent.press(screen.getByTestId('trigger'));
    });
    expect(screen.getByTestId('toast')).toBeTruthy();
    // 2500ms duration + 200ms fade-out
    act(() => {
      jest.advanceTimersByTime(2500 + 250);
    });
    expect(screen.queryByTestId('toast')).toBeNull();
  });

  it('useToast outside the provider returns a no-op', () => {
    function Probe() {
      const { show } = useToast();
      // Should not throw
      show('orphan');
      return <Text testID="probe">ok</Text>;
    }
    render(<Probe />);
    expect(screen.getByTestId('probe')).toBeTruthy();
  });
});
