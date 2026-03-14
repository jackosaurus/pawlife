import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { QuickAddSheet } from './QuickAddSheet';

jest.mock('@gorhom/bottom-sheet', () => {
  const RN = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: any) => <RN.View>{children}</RN.View>,
    BottomSheetView: RN.View,
  };
});

describe('QuickAddSheet', () => {
  const mockRef = { current: { close: jest.fn(), snapToIndex: jest.fn() } };

  it('renders all 4 options', () => {
    render(
      <QuickAddSheet bottomSheetRef={mockRef as any} onSelect={jest.fn()} />,
    );
    expect(screen.getByText('Vaccination')).toBeTruthy();
    expect(screen.getByText('Medication')).toBeTruthy();
    expect(screen.getByText('Weight')).toBeTruthy();
    expect(screen.getByText('Food Change')).toBeTruthy();
  });

  it('calls onSelect with correct action', () => {
    const onSelect = jest.fn();
    render(
      <QuickAddSheet bottomSheetRef={mockRef as any} onSelect={onSelect} />,
    );
    fireEvent.press(screen.getByTestId('quick-add-vaccination'));
    expect(onSelect).toHaveBeenCalledWith('vaccination');
  });
});
