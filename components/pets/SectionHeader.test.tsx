import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SectionHeader } from './SectionHeader';

describe('SectionHeader', () => {
  it('renders icon and title', () => {
    render(
      <SectionHeader icon="shield-checkmark-outline" title="Vaccinations" />,
    );
    expect(screen.getByText('Vaccinations')).toBeTruthy();
  });

  it('renders count when provided', () => {
    render(
      <SectionHeader
        icon="shield-checkmark-outline"
        title="Vaccinations"
        count={3}
      />,
    );
    expect(screen.getByText('(3)')).toBeTruthy();
  });

  it('does not render count when zero', () => {
    render(
      <SectionHeader
        icon="shield-checkmark-outline"
        title="Vaccinations"
        count={0}
      />,
    );
    expect(screen.queryByText('(0)')).toBeNull();
  });

  it('renders add button and calls onAction', () => {
    const onAction = jest.fn();
    render(
      <SectionHeader
        icon="shield-checkmark-outline"
        title="Vaccinations"
        onAction={onAction}
      />,
    );
    fireEvent.press(screen.getByTestId('section-add'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders alert badge when alertCount provided', () => {
    render(
      <SectionHeader
        icon="shield-checkmark-outline"
        title="Vaccinations"
        alertCount={2}
      />,
    );
    expect(screen.getByTestId('alert-badge')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('does not render alert badge when alertCount is zero', () => {
    render(
      <SectionHeader
        icon="shield-checkmark-outline"
        title="Vaccinations"
        alertCount={0}
      />,
    );
    expect(screen.queryByTestId('alert-badge')).toBeNull();
  });
});
