import React from 'react';
import { View, Text, Pressable } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export type QuickAddAction =
  | 'vaccination'
  | 'medication'
  | 'weight'
  | 'food-change';

interface QuickAddSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet>;
  onSelect: (action: QuickAddAction) => void;
}

const actions: { action: QuickAddAction; label: string; icon: string }[] = [
  { action: 'vaccination', label: 'Vaccination', icon: 'shield-checkmark-outline' },
  { action: 'medication', label: 'Medication', icon: 'medkit-outline' },
  { action: 'weight', label: 'Weight', icon: 'fitness-outline' },
  { action: 'food-change', label: 'Food Change', icon: 'restaurant-outline' },
];

export function QuickAddSheet({ bottomSheetRef, onSelect }: QuickAddSheetProps) {
  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['35%']}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: Colors.card }}
      handleIndicatorStyle={{ backgroundColor: Colors.border }}
    >
      <BottomSheetView className="px-6 pt-2 pb-4">
        <Text className="text-lg font-semibold text-text-primary mb-4">
          Add Record
        </Text>
        <View className="flex-row flex-wrap">
          {actions.map(({ action, label, icon }) => (
            <Pressable
              key={action}
              onPress={() => {
                bottomSheetRef.current?.close();
                onSelect(action);
              }}
              className="w-1/3 items-center mb-4"
              testID={`quick-add-${action}`}
            >
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-1">
                <Ionicons
                  name={icon as any}
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <Text className="text-xs text-text-secondary text-center">
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
