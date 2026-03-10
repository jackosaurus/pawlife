import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SegmentedFilter } from './SegmentedFilter';

describe('SegmentedFilter', () => {
  const options = [
    { label: 'All', value: 'all' },
    { label: 'Vaccinations', value: 'vaccinations' },
    { label: 'Medications', value: 'medications' },
  ];

  it('renders all options', () => {
    const { getByText } = render(
      <SegmentedFilter options={options} selected="all" onSelect={jest.fn()} />,
    );
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Vaccinations')).toBeTruthy();
    expect(getByText('Medications')).toBeTruthy();
  });

  it('calls onSelect when an option is pressed', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <SegmentedFilter options={options} selected="all" onSelect={onSelect} />,
    );
    fireEvent.press(getByTestId('filter-vaccinations'));
    expect(onSelect).toHaveBeenCalledWith('vaccinations');
  });

  it('renders selected option with testID', () => {
    const { getByTestId } = render(
      <SegmentedFilter
        options={options}
        selected="vaccinations"
        onSelect={jest.fn()}
      />,
    );
    expect(getByTestId('filter-vaccinations')).toBeTruthy();
  });
});
