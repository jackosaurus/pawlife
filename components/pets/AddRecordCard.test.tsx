import { render, fireEvent, screen } from '@testing-library/react-native';
import { AddRecordCard } from './AddRecordCard';

describe('AddRecordCard', () => {
  it('renders the label', () => {
    render(<AddRecordCard label="Add vaccination" onPress={jest.fn()} />);
    expect(screen.getByText('Add vaccination')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<AddRecordCard label="Add vet visit" onPress={onPress} />);
    fireEvent.press(screen.getByTestId('add-record-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
