import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SearchableDropdown, DropdownOption } from './SearchableDropdown';

const options = ['Labrador Retriever', 'Golden Retriever', 'Poodle'];

const richOptions: DropdownOption[] = [
  { label: 'Happy Paws Vet (last visit: Mar 15, 2025)', value: 'Happy Paws Vet' },
  { label: 'City Animal Hospital (last visit: Jan 10, 2025)', value: 'City Animal Hospital' },
];

describe('SearchableDropdown', () => {
  it('renders label', () => {
    render(
      <SearchableDropdown
        label="Breed"
        options={options}
        value={null}
        onSelect={jest.fn()}
      />,
    );
    expect(screen.getByText('Breed')).toBeTruthy();
  });

  it('filters options on input', () => {
    render(
      <SearchableDropdown
        label="Breed"
        placeholder="Search..."
        options={options}
        value={null}
        onSelect={jest.fn()}
      />,
    );
    fireEvent.changeText(screen.getByPlaceholderText('Search...'), 'Retriever');
    expect(screen.getByText('Labrador Retriever')).toBeTruthy();
    expect(screen.getByText('Golden Retriever')).toBeTruthy();
    expect(screen.queryByText('Poodle')).toBeNull();
  });

  it('calls onSelect when item is tapped', () => {
    const onSelect = jest.fn();
    render(
      <SearchableDropdown
        label="Breed"
        placeholder="Search..."
        options={options}
        value={null}
        onSelect={onSelect}
      />,
    );
    fireEvent.changeText(screen.getByPlaceholderText('Search...'), 'Poodle');
    fireEvent.press(screen.getByText('Poodle'));
    expect(onSelect).toHaveBeenCalledWith('Poodle');
  });

  it('shows error message', () => {
    render(
      <SearchableDropdown
        label="Breed"
        options={options}
        value={null}
        onSelect={jest.fn()}
        error="Required"
      />,
    );
    expect(screen.getByText('Required')).toBeTruthy();
  });

  it('shows all options on focus when showAllOnFocus is true', () => {
    render(
      <SearchableDropdown
        label="Clinic"
        placeholder="Search..."
        options={richOptions}
        value={null}
        onSelect={jest.fn()}
        showAllOnFocus
      />,
    );
    fireEvent(screen.getByPlaceholderText('Search...'), 'focus');
    expect(
      screen.getByText('Happy Paws Vet (last visit: Mar 15, 2025)'),
    ).toBeTruthy();
    expect(
      screen.getByText('City Animal Hospital (last visit: Jan 10, 2025)'),
    ).toBeTruthy();
  });

  it('does not show options on focus when showAllOnFocus is false', () => {
    render(
      <SearchableDropdown
        label="Breed"
        placeholder="Search..."
        options={options}
        value={null}
        onSelect={jest.fn()}
      />,
    );
    fireEvent(screen.getByPlaceholderText('Search...'), 'focus');
    // No text typed, showAllOnFocus defaults to false, so no dropdown
    expect(screen.queryByText('Labrador Retriever')).toBeNull();
  });

  it('selects value (not label) from rich options', () => {
    const onSelect = jest.fn();
    render(
      <SearchableDropdown
        label="Clinic"
        placeholder="Search..."
        options={richOptions}
        value={null}
        onSelect={onSelect}
        showAllOnFocus
      />,
    );
    fireEvent(screen.getByPlaceholderText('Search...'), 'focus');
    fireEvent.press(
      screen.getByText('Happy Paws Vet (last visit: Mar 15, 2025)'),
    );
    expect(onSelect).toHaveBeenCalledWith('Happy Paws Vet');
  });

  it('filters rich options by value', () => {
    render(
      <SearchableDropdown
        label="Clinic"
        placeholder="Search..."
        options={richOptions}
        value={null}
        onSelect={jest.fn()}
        showAllOnFocus
      />,
    );
    fireEvent.changeText(screen.getByPlaceholderText('Search...'), 'City');
    expect(
      screen.getByText('City Animal Hospital (last visit: Jan 10, 2025)'),
    ).toBeTruthy();
    expect(screen.queryByText(/Happy Paws/)).toBeNull();
  });
});
