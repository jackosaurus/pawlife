import React from 'react';
import { Modal, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface DeleteConfirmationProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DeleteConfirmation({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: DeleteConfirmationProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      testID="delete-modal"
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
          {/* Handle indicator */}
          <View className="items-center mb-4">
            <View className="w-10 h-1 rounded-full bg-border" />
          </View>

          <View className="items-center mb-5">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: `${Colors.statusOverdue}15` }}
            >
              <Ionicons
                name="trash-outline"
                size={24}
                color={Colors.statusOverdue}
              />
            </View>
            <Text className="text-lg font-bold text-text-primary text-center">
              {title}
            </Text>
            <Text className="text-base text-text-secondary text-center mt-1">
              {message}
            </Text>
          </View>

          <Pressable
            onPress={onConfirm}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-status-overdue items-center mb-3"
            testID="confirm-delete-button"
          >
            {loading ? (
              <ActivityIndicator
                color="#FFFFFF"
                size="small"
                testID="delete-loading"
              />
            ) : (
              <Text className="text-white font-semibold text-base">
                Delete
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={onCancel}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-white border border-border items-center"
            testID="cancel-button"
          >
            <Text className="text-text-primary font-semibold text-base">
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
