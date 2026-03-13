import React, { useState } from 'react';
import {
  Text,
  TextInput as RNTextInput,
  View,
  Pressable,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { Colors } from '@/constants/colors';

interface TextInputProps extends RNTextInputProps {
  label: string;
  error?: string;
}

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  ({ label, error, secureTextEntry, style, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(secureTextEntry);

    const borderColor = error
      ? Colors.statusOverdue
      : focused
        ? Colors.primary
        : Colors.border;

    return (
      <View className="mb-4">
        <Text className="text-text-secondary text-base mb-1.5">
          {label}
        </Text>
        <View
          style={[{ borderColor, borderWidth: 1, borderRadius: 12 }]}
          className="flex-row items-center bg-white px-4"
        >
          <RNTextInput
            ref={ref}
            className="flex-1 py-3.5 text-base text-text-primary"
            placeholderTextColor={Colors.textSecondary}
            secureTextEntry={hidden}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            autoCapitalize="none"
            {...props}
          />
          {secureTextEntry && (
            <Pressable
              onPress={() => setHidden((h) => !h)}
              hitSlop={8}
              testID="toggle-password"
            >
              <Text className="text-text-secondary text-sm">
                {hidden ? 'Show' : 'Hide'}
              </Text>
            </Pressable>
          )}
        </View>
        {error && (
          <Text className="text-status-overdue text-sm mt-1">
            {error}
          </Text>
        )}
      </View>
    );
  },
);

TextInput.displayName = 'TextInput';
