import { ActivityIndicator, Pressable, Text } from 'react-native';
import { Colors } from '@/constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'text';
}

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`rounded-2xl py-4 items-center justify-center ${
        variant === 'primary'
          ? 'bg-primary'
          : variant === 'secondary'
            ? 'bg-white border border-primary'
            : ''
      } ${isDisabled ? 'opacity-50' : ''}`}
      style={({ pressed }) =>
        pressed && variant === 'primary'
          ? { backgroundColor: Colors.primaryPressed }
          : undefined
      }
      testID="button"
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#FFFFFF' : Colors.primary}
          testID="loading-indicator"
        />
      ) : (
        <Text
          className={`text-headline ${
            variant === 'primary'
              ? 'text-white'
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
