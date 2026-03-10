import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SegmentedControl } from './SegmentedControl';

const options = [
  { label: 'Dog', value: 'dog' },
  { label: 'Cat', value: 'cat' },
];

describe('SegmentedControl', () => {
  it('renders all options', () => {
    render(
      <SegmentedControl options={options} selected="dog" onSelect={jest.fn()} />,
    );
    expect(screen.getByText('Dog')).toBeTruthy();
    expect(screen.getByText('Cat')).toBeTruthy();
  });

  it('calls onSelect when tapped', () => {
    const onSelect = jest.fn();
    render(
      <SegmentedControl options={options} selected="dog" onSelect={onSelect} />,
    );
    fireEvent.press(screen.getByTestId('segment-cat'));
    expect(onSelect).toHaveBeenCalledWith('cat');
  });
});
