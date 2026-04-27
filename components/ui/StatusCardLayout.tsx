import { View, Text, ViewStyle } from 'react-native';
import { Card } from '@/components/ui/Card';

/**
 * StatusCardLayout — shared layout primitive for record cards that show
 * an at-a-glance status indicator on the right (MedicationCard, VaccinationCard,
 * and any future variant).
 *
 * # Layout invariant (don't break this)
 *
 * The status indicator is rendered in an **absolute-positioned slot** anchored
 * to the top-right of the card. This guarantees the indicator's vertical
 * position is identical across every card in a list, regardless of:
 *   - left-column content height (long vaccine names, dosage strings, etc.)
 *   - right-column content (with/without Log button, with/without context text)
 *   - Dynamic Type scaling (within our 1.3x clamp)
 *
 * Without this, when the right column flexes around variable content the
 * indicator drifts vertically per row, producing a visibly ragged list. See
 * `docs/pawlife-design-system.md` → "Status card layout invariant".
 *
 * # Slots
 *
 * - `left`             — primary content (title, subtitle). Fills remaining width.
 * - `indicator`        — status icon (dot, check, fraction). Anchored top-right.
 * - `rightBelow`       — optional content stacked under the indicator
 *                        (context text + Log button). Right-aligned column,
 *                        fixed width. Reserved space for the indicator above
 *                        is built in via `paddingTop`.
 * - `footer`           — optional full-width content below the row (stale prompt).
 */

// Card padding-4 (16pt) controls inset; indicator is positioned at the same
// 16pt offset so it visually sits flush at the top-right corner.
const INDICATOR_OFFSET = 16;

// Fixed width for the right column. Matches the previous `minWidth: 96`.
const RIGHT_COLUMN_WIDTH = 96;

// Vertical space reserved above the right-column-below content so it never
// overlaps the absolute-positioned indicator. Indicator height (28pt for the
// largest variant — green check) + 4pt breathing room.
const RIGHT_COLUMN_TOP_RESERVE = 32;

interface StatusCardLayoutProps {
  left: React.ReactNode;
  indicator: React.ReactNode;
  rightBelow?: React.ReactNode;
  footer?: React.ReactNode;
  onPress: () => void;
}

export function StatusCardLayout({
  left,
  indicator,
  rightBelow,
  footer,
  onPress,
}: StatusCardLayoutProps) {
  // Reserve enough left-column height that even an icon-only card has the
  // same total height as one with title + subtitle. This keeps card heights
  // visually consistent across a list and makes left-column content centered
  // rather than top-aligned (matches the previous `justify-center` behavior).
  const leftMinHeight: ViewStyle = { minHeight: RIGHT_COLUMN_TOP_RESERVE };

  return (
    <Card className="p-4 mb-3" onPress={onPress}>
      <View className="flex-row">
        {/* Left: primary content, fills remaining width */}
        <View
          className="flex-1 justify-center mr-3"
          style={leftMinHeight}
        >
          {left}
        </View>

        {/* Right column reserves a fixed width and reserves vertical space
            for the absolute-positioned indicator above. */}
        <View
          style={{
            width: RIGHT_COLUMN_WIDTH,
            paddingTop: RIGHT_COLUMN_TOP_RESERVE,
          }}
          className="items-center"
        >
          {rightBelow}
        </View>

        {/* Status indicator: absolute-positioned, top-right.
            ALWAYS at the same offset, regardless of any other content. */}
        <View
          testID="status-indicator-slot"
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: RIGHT_COLUMN_WIDTH,
            height: RIGHT_COLUMN_TOP_RESERVE,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {indicator}
        </View>
      </View>

      {footer}
    </Card>
  );
}

// Re-export a body wrapper for callers that want consistent text styling.
// Not strictly required, just convenient.
export const StatusCardText = Text;
