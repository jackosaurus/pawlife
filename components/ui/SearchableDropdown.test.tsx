import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SearchableDropdown } from './SearchableDropdown';

const options = ['Labrador Retriever', 'Golden Retriever', 'Poodle'];

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
});
