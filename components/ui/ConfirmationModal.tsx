import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  TextInput as RNTextInput,
} from 'react-native';
import { Colors } from '@/constants/colors';

export type ConfirmationSeverity = 'standard' | 'destructive' | 'irreversible';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  /** Confirm CTA copy, e.g. "Delete", "Sign Out", "Leave family". */
  confirmLabel: string;
  /** Cancel CTA copy. Defaults to "Cancel". */
  cancelLabel?: string;
  /**
   * Severity tier (canonical destructive-action pattern):
   *
   * - `standard`: ghost text neutral confirm. Plain confirmation.
   * - `destructive`: ghost text confirm in `Colors.destructive`. Body copy
   *    must explicitly name what will be lost — caller's responsibility.
   * - `irreversible`: same layout as `destructive` PLUS a typed-confirm
   *    input gate. Confirm becomes a filled destructive button, disabled
   *    until the input matches `typedConfirmationWord` exactly. The ONLY
   *    place in the app where filled red is used.
   *
   * Defaults to `standard`.
   */
  severity?: ConfirmationSeverity;
  onConfirm: () => void;
  onCancel: () => void;
  /** Loading spinner on confirm (action in flight). */
  loading?: boolean;
  /** Required when severity='irreversible'. The exact word the user must type. */
  typedConfirmationWord?: string;
}

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  severity = 'standard',
  onConfirm,
  onCancel,
  loading,
  typedConfirmationWord,
}: ConfirmationModalProps) {
  const [typedValue, setTypedValue] = useState('');
  const inputRef = useRef<RNTextInput>(null);

  // Reset typed value whenever the modal closes/opens. Auto-focus the input
  // when an irreversible modal opens so the user lands directly on the gate.
  useEffect(() => {
    if (!visible) {
      setTypedValue('');
      return;
    }
    if (severity === 'irreversible') {
      // Small delay lets the modal mount before focusing.
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [visible, severity]);

  const isIrreversible = severity === 'irreversible';
  const typedGatePassed =
    !isIrreversible ||
    (typedConfirmationWord != null && typedValue === typedConfirmationWord);
  const confirmDisabled = !!loading || !typedGatePassed;

  const isDestructiveTone =
    severity === 'destructive' || severity === 'irreversible';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      testID="confirmation-modal"
    >
      <View className="flex-1 justify-end bg-black/40">
        <Pressable
          className="flex-1"
          onPress={loading ? undefined : onCancel}
          testID="backdrop"
        />
        <View
          className="bg-card px-6 pt-3 pb-10"
          style={{
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
          }}
        >
          {/* Drag handle */}
          <View className="items-center mb-4">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          <View className="items-center mb-5">
            <Text className="text-lg font-bold text-text-primary text-center">
              {title}
            </Text>
            <Text className="text-base text-text-secondary text-center mt-2">
              {message}
            </Text>
          </View>

          {isIrreversible && typedConfirmationWord && (
            <View className="mb-4">
              <Text className="text-text-secondary text-sm mb-2">
                Type <Text className="font-bold">{typedConfirmationWord}</Text> to
                confirm.
              </Text>
              <RNTextInput
                ref={inputRef}
                value={typedValue}
                onChangeText={setTypedValue}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder={typedConfirmationWord}
                placeholderTextColor={Colors.textSecondary}
                style={{
                  borderWidth: 1,
                  borderColor: Colors.border,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: Colors.textPrimary,
                  backgroundColor: '#FFFFFF',
                }}
                testID="typed-confirmation-input"
              />
            </View>
          )}

          {/* Confirm button */}
          {isIrreversible ? (
            // Filled destructive — the ONLY place this exists.
            <Pressable
              onPress={onConfirm}
              disabled={confirmDisabled}
              className="w-full py-3.5 rounded-xl items-center mb-3"
              style={{
                backgroundColor: Colors.destructive,
                opacity: confirmDisabled ? 0.5 : 1,
              }}
              testID="confirm-button"
            >
              {loading ? (
                <ActivityIndicator
                  color="#FFFFFF"
                  size="small"
                  testID="confirm-loading"
                />
              ) : (
                <Text className="text-white font-semibold text-base">
                  {confirmLabel}
                </Text>
              )}
            </Pressable>
          ) : (
            // Ghost text confirm — destructive red or neutral plum.
            <Pressable
              onPress={onConfirm}
              disabled={confirmDisabled}
              className="w-full py-3.5 rounded-xl items-center mb-3 bg-white border border-border"
              style={{ opacity: confirmDisabled ? 0.5 : 1 }}
              testID="confirm-button"
            >
              {loading ? (
                <ActivityIndicator
                  color={
                    isDestructiveTone ? Colors.destructive : Colors.textPrimary
                  }
                  size="small"
                  testID="confirm-loading"
                />
              ) : (
                <Text
                  className="font-semibold text-base"
                  style={{
                    color: isDestructiveTone
                      ? Colors.destructive
                      : Colors.textPrimary,
                  }}
                >
                  {confirmLabel}
                </Text>
              )}
            </Pressable>
          )}

          {/* Cancel — always neutral ghost text */}
          <Pressable
            onPress={onCancel}
            disabled={loading}
            className="w-full py-3.5 rounded-xl items-center bg-white border border-border"
            style={{ opacity: loading ? 0.5 : 1 }}
            testID="cancel-button"
          >
            <Text className="text-text-primary font-semibold text-base">
              {cancelLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
