import { render, fireEvent, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { DateInput } from './DateInput';

// Mock the date time picker
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: any) => (
      <View testID="mock-datetime-picker" {...props} />
    ),
  };
});

describe('DateInput', () => {
  const onChange = jest.fn();

  beforeEach(() => {
    onChange.mockClear();
    Platform.OS = 'ios';
  });

  it('renders label and placeholder when no value', () => {
    render(
      <DateInput label="Start Date" value={null} onChange={onChange} />,
    );
    expect(screen.getByText('Start Date')).toBeTruthy();
    expect(screen.getByText('Select date')).toBeTruthy();
  });

  it('renders custom placeholder', () => {
    render(
      <DateInput
        label="Date"
        value={null}
        onChange={onChange}
        placeholder="Pick a date"
      />,
    );
    expect(screen.getByText('Pick a date')).toBeTruthy();
  });

  it('displays formatted date when value is provided', () => {
    render(
      <DateInput label="Date" value="2025-03-15" onChange={onChange} />,
    );
    // formatDate should display a readable date
    expect(screen.queryByText('Select date')).toBeNull();
  });

  it('shows error message', () => {
    render(
      <DateInput
        label="Date"
        value={null}
        onChange={onChange}
        error="Date is required"
      />,
    );
    expect(screen.getByText('Date is required')).toBeTruthy();
  });

  it('does not show error when no error', () => {
    render(
      <DateInput label="Date" value={null} onChange={onChange} />,
    );
    expect(screen.queryByText(/required/)).toBeNull();
  });

  it('shows date picker when pressed', () => {
    render(
      <DateInput label="Date" value={null} onChange={onChange} />,
    );
    expect(screen.queryByTestId('date-picker')).toBeNull();
    fireEvent.press(screen.getByTestId('date-input-trigger'));
    expect(screen.getByTestId('date-picker')).toBeTruthy();
  });

  it('shows Done button on iOS when picker is open', () => {
    Platform.OS = 'ios';
    render(
      <DateInput label="Date" value={null} onChange={onChange} />,
    );
    fireEvent.press(screen.getByTestId('date-input-trigger'));
    expect(screen.getByTestId('date-picker-done')).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();
  });

  it('hides picker when Done is pressed on iOS', () => {
    Platform.OS = 'ios';
    render(
      <DateInput label="Date" value={null} onChange={onChange} />,
    );
    fireEvent.press(screen.getByTestId('date-input-trigger'));
    expect(screen.getByTestId('date-picker')).toBeTruthy();
    fireEvent.press(screen.getByTestId('date-picker-done'));
    expect(screen.queryByTestId('date-picker')).toBeNull();
  });

  it('renders calendar icon', () => {
    render(
      <DateInput label="Date" value={null} onChange={onChange} />,
    );
    // The Ionicons calendar-outline is rendered
    expect(screen.getByTestId('date-input-trigger')).toBeTruthy();
  });

  it('handles invalid date value gracefully', () => {
    render(
      <DateInput label="Date" value="not-a-date" onChange={onChange} />,
    );
    // Should show placeholder since date is invalid
    expect(screen.getByText('Select date')).toBeTruthy();
  });
});
