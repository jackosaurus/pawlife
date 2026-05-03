import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { PullQuote } from './PullQuote';
import { Colors } from '@/constants/colors';
import { DisplayFontFamily } from '@/constants/typography';

const flattenStyle = (style: unknown): Record<string, unknown> => {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>(
      (acc, s) => ({ ...acc, ...flattenStyle(s) }),
      {},
    );
  }
  return style as Record<string, unknown>;
};

describe('PullQuote', () => {
  it('renders the supplied string children', () => {
    const { getByText } = render(<PullQuote>Bemy = Beau + Remy</PullQuote>);
    expect(getByText('Bemy = Beau + Remy')).toBeTruthy();
  });

  it('renders ReactNode children', () => {
    const { getByText } = render(
      <PullQuote>
        <Text>Hello world</Text>
      </PullQuote>,
    );
    expect(getByText('Hello world')).toBeTruthy();
  });

  it('applies the Fraunces bold display font and plum color', () => {
    const { getByTestId } = render(
      <PullQuote>Bemy = Beau + Remy</PullQuote>,
    );
    const style = flattenStyle(getByTestId('pull-quote').props.style);
    expect(style.fontFamily).toBe(DisplayFontFamily.bold);
    expect(style.color).toBe(Colors.primary);
  });

  it('uses the children as the default accessibility label when string', () => {
    const { getByTestId } = render(
      <PullQuote>Bemy = Beau + Remy</PullQuote>,
    );
    expect(getByTestId('pull-quote').props.accessibilityLabel).toBe(
      'Bemy = Beau + Remy',
    );
  });

  it('honours an explicit accessibilityLabel override', () => {
    const { getByTestId } = render(
      <PullQuote accessibilityLabel="Bemy equals Beau plus Remy">
        Bemy = Beau + Remy
      </PullQuote>,
    );
    expect(getByTestId('pull-quote').props.accessibilityLabel).toBe(
      'Bemy equals Beau plus Remy',
    );
  });
});
