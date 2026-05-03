import { ReactNode } from 'react';
import { Text } from 'react-native';
import { Colors } from '@/constants/colors';
import { DisplayFontFamily } from '@/constants/typography';

interface PullQuoteProps {
  children: string | ReactNode;
  /**
   * Optional override for the screen-reader label. Defaults to the children
   * verbatim when they're a string. Useful for "Bemy = Beau + Remy" → "Bemy
   * equals Beau plus Remy" so the equals-sign isn't read literally.
   */
  accessibilityLabel?: string;
}

/**
 * Page-level pull-quote primitive — Fraunces bold, plum, centered, with
 * generous breathing room above and below. Single-line by default at the
 * lengths we use it for ("Bemy = Beau + Remy"). No background, no border, no
 * decorative quote glyphs — the type treatment is the moment.
 *
 * Spec: `docs/bemy-about-page-design.md` §"Pull-quote — the 'Bemy = Beau +
 * Remy' beat".
 */
export function PullQuote({ children, accessibilityLabel }: PullQuoteProps) {
  const computedLabel =
    accessibilityLabel ?? (typeof children === 'string' ? children : undefined);

  return (
    <Text
      accessibilityLabel={computedLabel}
      className="text-largeTitle text-primary text-center my-8 px-8"
      style={{
        fontFamily: DisplayFontFamily.bold,
        color: Colors.primary,
      }}
      testID="pull-quote"
    >
      {children}
    </Text>
  );
}
