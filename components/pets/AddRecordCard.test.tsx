import { render, fireEvent, screen } from '@testing-library/react-native';
import { AddRecordCard } from './AddRecordCard';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, testID }: { name: string; testID?: string }) => {
    const RN = jest.requireActual('react-native');
    return <RN.Text testID={testID ?? `icon-${name}`}>{name}</RN.Text>;
  },
}));

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

  it('defaults to the add variant (plus icon)', () => {
    render(<AddRecordCard label="Add vaccination" onPress={jest.fn()} />);
    expect(screen.getByTestId('icon-add')).toBeTruthy();
    expect(screen.queryByTestId('icon-pencil-outline')).toBeNull();
  });

  it('renders the pencil-outline icon for the edit variant', () => {
    render(
      <AddRecordCard label="Edit profile" variant="edit" onPress={jest.fn()} />,
    );
    expect(screen.getByTestId('icon-pencil-outline')).toBeTruthy();
    expect(screen.queryByTestId('icon-add')).toBeNull();
  });

  it('renders the custom label for the edit variant', () => {
    render(
      <AddRecordCard label="Edit profile" variant="edit" onPress={jest.fn()} />,
    );
    expect(screen.getByText('Edit profile')).toBeTruthy();
  });
});
