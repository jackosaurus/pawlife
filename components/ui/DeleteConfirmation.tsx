import { Modal, View, Text, Pressable, ActivityIndicator } from 'react-native';
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
      <View className="flex-1 items-center justify-center bg-black/50 px-8">
        <View className="bg-card rounded-card w-full p-6">
          <Text className="text-lg font-bold text-text-primary mb-2">
            {title}
          </Text>
          <Text className="text-sm text-text-secondary mb-6">{message}</Text>
          <View className="flex-row justify-end gap-3">
            <Pressable
              onPress={onCancel}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl"
              testID="cancel-button"
            >
              <Text className="text-text-secondary font-medium">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-status-overdue"
              testID="confirm-delete-button"
            >
              {loading ? (
                <ActivityIndicator
                  color="#FFFFFF"
                  size="small"
                  testID="delete-loading"
                />
              ) : (
                <Text className="text-white font-medium">Delete</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
