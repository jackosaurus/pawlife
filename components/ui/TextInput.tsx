import React, { useState } from 'react';
import {
  Text,
  TextInput as RNTextInput,
  View,
  Pressable,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

    // Visible focus state — 2px border in brand purple when focused, 2px in
    // coral when an inline error is present, 1px in warm gray otherwise.
    // Matches the auth-flow designer spec (§5/§6) so an errored field reads
    // as "weighted" not "subtly outlined".
    const borderWidth = focused || !!error ? 2 : 1;

    return (
      <View className="mb-4">
        <Text className="text-text-secondary text-body mb-1.5">
          {label}
        </Text>
        <View
          style={[{ borderColor, borderWidth, borderRadius: 12 }]}
          className="flex-row items-center bg-white px-4"
        >
          <RNTextInput
            ref={ref}
            className="flex-1 py-3.5 text-body text-text-primary"
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
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel={
                hidden ? 'Show password' : 'Hide password'
              }
              testID="toggle-password"
              style={{
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={hidden ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={Colors.textSecondary}
              />
            </Pressable>
          )}
        </View>
        {error && (
          <Text className="text-status-overdue text-footnote mt-1">
            {error}
          </Text>
        )}
      </View>
    );
  },
);

TextInput.displayName = 'TextInput';
