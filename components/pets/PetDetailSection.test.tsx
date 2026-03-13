import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PetDetailSection } from './PetDetailSection';

describe('PetDetailSection', () => {
  const defaultProps = {
    icon: 'shield-checkmark-outline',
    title: 'Vaccinations',
    count: 0,
    onAdd: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title', () => {
    render(
      <PetDetailSection {...defaultProps}>
        <Text>Child</Text>
      </PetDetailSection>,
    );
    expect(screen.getByText('Vaccinations')).toBeTruthy();
  });

  it('renders empty message when count is 0', () => {
    render(
      <PetDetailSection
        {...defaultProps}
        emptyMessage="No vaccinations recorded yet"
      >
        <Text>Child</Text>
      </PetDetailSection>,
    );
    expect(screen.getByText('No vaccinations recorded yet')).toBeTruthy();
  });

  it('renders children when count > 0', () => {
    render(
      <PetDetailSection {...defaultProps} count={2}>
        <Text>Record 1</Text>
        <Text>Record 2</Text>
      </PetDetailSection>,
    );
    expect(screen.getByText('Record 1')).toBeTruthy();
    expect(screen.getByText('Record 2')).toBeTruthy();
  });

  it('shows see all when count > 3 and onSeeAll provided', () => {
    const onSeeAll = jest.fn();
    render(
      <PetDetailSection {...defaultProps} count={5} onSeeAll={onSeeAll}>
        <Text>Records</Text>
      </PetDetailSection>,
    );
    fireEvent.press(screen.getByTestId('see-all'));
    expect(onSeeAll).toHaveBeenCalledTimes(1);
  });

  it('does not show see all when count <= 3', () => {
    render(
      <PetDetailSection {...defaultProps} count={2} onSeeAll={jest.fn()}>
        <Text>Records</Text>
      </PetDetailSection>,
    );
    expect(screen.queryByTestId('see-all')).toBeNull();
  });
});
