import { Pressable, Text } from 'react-native';
import { Colors } from '@/constants/colors';

interface DestructiveTextButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}

/**
 * Tertiary destructive text button. No border, no fill — red text on transparent.
 *
 * Use for the rare destructive action on a record detail screen (Delete) and
 * for destructive secondary actions in lists (Remove member, Leave family, etc).
 *
 * Filled red is reserved for the Delete Account flow only — every other
 * destructive action uses this component.
 */
export function DestructiveTextButton({
  label,
  onPress,
  disabled,
  testID,
}: DestructiveTextButtonProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      className="items-center justify-center py-3"
      style={({ pressed }) => ({
        opacity: disabled ? 0.5 : pressed ? 0.6 : 1,
      })}
      testID={testID ?? 'destructive-text-button'}
    >
      <Text
        className="text-base font-semibold"
        style={{ color: Colors.destructive }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
