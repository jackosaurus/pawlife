import { View, Text } from 'react-native';
import { useAgeMoment } from '@/hooks/useAgeMoment';
import { Colors } from '@/constants/colors';

interface AgePillProps {
  petName: string;
  /**
   * Pet's date of birth — required. The pet detail screen only renders this
   * pill when the pet has a dob; pets with `approximate_age_months` only
   * fall back to the legacy static age string.
   */
  dob: Date | string;
}

/**
 * Smart age indicator on the pet detail sticky header. Replaces the static
 * `MetadataPill` rendering of `calculateAge(...)`. Resolves to one of four
 * states (default / birthday / savor / puppy) via `useAgeMoment`.
 *
 * On birthday day, the pill takes a soft coral tint (`Colors.accent` at low
 * opacity) — warmer presence without becoming a banner. Every other state
 * keeps the standard white pill treatment so the metadata row stays calm.
 *
 * Long pet name handling: at Dynamic Type 1.3x, a name like "Sir Reginald"
 * combined with the birthday copy can push the pill wider than its
 * container. We let the line truncate with `numberOfLines={1}` and ellipsis
 * — the name truncates first since it's at the start of the string, which
 * keeps the age info visible.
 */
export function AgePill({ petName, dob }: AgePillProps) {
  const { label, isFestive } = useAgeMoment(petName, dob);

  // Coral-tinted background for the birthday state. We compose the rgba
  // inline (vs. a Tailwind opacity class) so the festive treatment is
  // unambiguous in tests and in design-doc audits.
  const festiveStyle = isFestive
    ? {
        backgroundColor: 'rgba(232, 115, 90, 0.15)', // Colors.accent @ 15%
        borderWidth: 1,
        borderColor: Colors.accent,
      }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
      };

  return (
    <View
      testID="age-pill"
      accessibilityLabel={label}
      className={`${isFestive ? '' : 'bg-white'} rounded-full px-4 py-2 max-w-full`}
      style={festiveStyle}
    >
      <Text
        testID="age-pill-label"
        numberOfLines={1}
        ellipsizeMode="tail"
        className={`text-footnote font-semibold ${isFestive ? 'text-accent' : 'text-text-primary'}`}
      >
        {label}
      </Text>
    </View>
  );
}
