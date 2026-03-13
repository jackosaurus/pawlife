import React from 'react';
import { render } from '@testing-library/react-native';
import { DetailRow } from './DetailRow';

describe('DetailRow', () => {
  it('renders label and value', () => {
    const { getByText } = render(
      <DetailRow label="Brand" value="Royal Canin" />,
    );
    expect(getByText('Brand')).toBeTruthy();
    expect(getByText('Royal Canin')).toBeTruthy();
  });

  it('renders bottom border by default', () => {
    const { getByText } = render(
      <DetailRow label="Weight" value="13 kg" />,
    );
    // The outer View is the grandparent of the label Text
    const row = getByText('Weight').parent?.parent;
    expect(row?.props.className).toContain('border-b');
  });

  it('omits bottom border when isLast is true', () => {
    const { getByText } = render(
      <DetailRow label="Notes" value="All good" isLast />,
    );
    const row = getByText('Notes').parent?.parent;
    expect(row?.props.className).not.toContain('border-b');
  });
});
