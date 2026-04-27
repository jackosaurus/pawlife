import React from 'react';
import { Text, View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { StatusCardLayout } from './StatusCardLayout';

/**
 * These tests pin the layout invariant that prevents alignment drift in
 * status-bearing card lists (Vaccinations, Medications). The status indicator
 * MUST be rendered into an absolute-positioned slot at the top-right of the
 * card, so its vertical position is identical no matter what other content
 * the card carries. See `StatusCardLayout.tsx` for the rationale.
 */
describe('StatusCardLayout', () => {
  function renderVariant(opts: {
    left?: React.ReactNode;
    rightBelow?: React.ReactNode;
    footer?: React.ReactNode;
  } = {}) {
    return render(
      <StatusCardLayout
        onPress={() => {}}
        left={opts.left ?? <Text>Title</Text>}
        indicator={<View testID="my-indicator" />}
        rightBelow={opts.rightBelow}
        footer={opts.footer}
      />,
    );
  }

  it('renders the indicator inside an absolute-positioned slot at top:0 right:0', () => {
    const { getByTestId } = renderVariant();
    const slot = getByTestId('status-indicator-slot');
    const style = Array.isArray(slot.props.style)
      ? Object.assign({}, ...slot.props.style)
      : slot.props.style;
    expect(style.position).toBe('absolute');
    expect(style.top).toBe(0);
    expect(style.right).toBe(0);
  });

  it('renders the indicator slot with a fixed width and reserved height', () => {
    const { getByTestId } = renderVariant();
    const slot = getByTestId('status-indicator-slot');
    const style = Array.isArray(slot.props.style)
      ? Object.assign({}, ...slot.props.style)
      : slot.props.style;
    expect(typeof style.width).toBe('number');
    expect(typeof style.height).toBe('number');
    expect(style.width).toBeGreaterThan(0);
    expect(style.height).toBeGreaterThan(0);
  });

  it('keeps the indicator slot style identical regardless of left content length', () => {
    const shortLeft = renderVariant({ left: <Text>A</Text> });
    const longLeft = renderVariant({
      left: (
        <Text>
          {'A very very very very very very very long vaccine name that wraps'}
        </Text>
      ),
    });

    const a = shortLeft.getByTestId('status-indicator-slot');
    const b = longLeft.getByTestId('status-indicator-slot');

    const styleA = Array.isArray(a.props.style)
      ? Object.assign({}, ...a.props.style)
      : a.props.style;
    const styleB = Array.isArray(b.props.style)
      ? Object.assign({}, ...b.props.style)
      : b.props.style;

    // Same absolute coords, same size — the invariant we care about.
    expect(styleA.position).toBe(styleB.position);
    expect(styleA.top).toBe(styleB.top);
    expect(styleA.right).toBe(styleB.right);
    expect(styleA.width).toBe(styleB.width);
    expect(styleA.height).toBe(styleB.height);
  });

  it('keeps the indicator slot style identical with vs without rightBelow content', () => {
    const without = renderVariant({ rightBelow: null });
    const with_ = renderVariant({
      rightBelow: <Text>Some context · Log button area</Text>,
    });

    const a = without.getByTestId('status-indicator-slot');
    const b = with_.getByTestId('status-indicator-slot');

    const styleA = Array.isArray(a.props.style)
      ? Object.assign({}, ...a.props.style)
      : a.props.style;
    const styleB = Array.isArray(b.props.style)
      ? Object.assign({}, ...b.props.style)
      : b.props.style;

    expect(styleA.top).toBe(styleB.top);
    expect(styleA.right).toBe(styleB.right);
    expect(styleA.width).toBe(styleB.width);
    expect(styleA.height).toBe(styleB.height);
  });

  it('renders footer content when provided', () => {
    const { getByTestId } = renderVariant({
      footer: <View testID="my-footer" />,
    });
    expect(getByTestId('my-footer')).toBeTruthy();
  });

  it('does not render footer wrapper when footer is null', () => {
    const { queryByTestId } = renderVariant({ footer: null });
    expect(queryByTestId('my-footer')).toBeNull();
  });

  it('renders the indicator child inside the slot', () => {
    const { getByTestId } = renderVariant();
    expect(getByTestId('my-indicator')).toBeTruthy();
  });

  it('passes through onPress to the underlying Card', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <StatusCardLayout
        onPress={onPress}
        left={<Text>Title</Text>}
        indicator={<View testID="ind" />}
      />,
    );
    // Card renders with testID="card"
    fireEvent.press(getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
