import { ActivityIndicator, Pressable, Text } from 'react-native';
import { Colors } from '@/constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'text' | 'brandYellow';
}

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const baseClass =
    variant === 'primary'
      ? 'bg-primary'
      : variant === 'secondary'
        ? 'bg-white border border-primary'
        : variant === 'brandYellow'
          ? 'bg-brand-yellow'
          : '';

  // Disabled state: clearly inert mid-warm-gray fill instead of a faded
  // primary that reads as "plausibly tappable" (auth-screen redesign brief).
  // Sign-up screen uses the always-enabled CTA pattern, but this state is
  // still required for the (loading) case and any future caller that opts
  // into the disabled treatment directly.
  const disabledStyle = isDisabled
    ? { backgroundColor: '#C4BEB6', borderColor: '#C4BEB6' }
    : undefined;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`rounded-2xl py-4 items-center justify-center ${baseClass}`}
      style={({ pressed }) => {
        if (isDisabled) return disabledStyle;
        if (pressed && variant === 'primary') {
          return { backgroundColor: Colors.primaryPressed };
        }
        if (pressed && variant === 'brandYellow') {
          return { backgroundColor: Colors.brandYellowPressed };
        }
        return undefined;
      }}
      testID="button"
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary'
              ? '#FFFFFF'
              : variant === 'brandYellow'
                ? Colors.primary
                : Colors.primary
          }
          testID="loading-indicator"
        />
      ) : (
        <Text
          className={`text-headline ${
            variant === 'primary'
              ? 'text-white'
              : variant === 'brandYellow'
                ? 'text-primary'
                : variant === 'secondary'
                  ? 'text-primary'
                  : 'text-primary'
          }`}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
