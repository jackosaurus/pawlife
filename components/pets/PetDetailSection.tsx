import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionHeader } from '@/components/pets/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';

interface PetDetailSectionProps {
  icon: string;
  title: string;
  count: number;
  alertCount?: number;
  onAdd: () => void;
  onSeeAll?: () => void;
  actionIcon?: string;
  actionLabel?: string;
  emptyMessage?: string;
  children: React.ReactNode;
}

export function PetDetailSection({
  icon,
  title,
  count,
  alertCount,
  onAdd,
  onSeeAll,
  actionIcon,
  emptyMessage,
  children,
}: PetDetailSectionProps) {
  return (
    <View className="mb-6">
      <SectionHeader
        icon={icon}
        title={title}
        count={count}
        onAction={onAdd}
        actionIcon={actionIcon}
        alertCount={alertCount}
      />
      <Card className="px-5">
        {count === 0 ? (
          <View className="py-5">
            <Text className="text-base text-text-secondary">
              {emptyMessage ?? `No ${title.toLowerCase()} yet`}
            </Text>
          </View>
        ) : (
          <>
            {children}
            {onSeeAll && count > 3 ? (
              <Pressable
                onPress={onSeeAll}
                className="py-4 flex-row items-center justify-center border-t border-border"
                testID="see-all"
              >
                <Text className="text-base font-medium text-primary">
                  See all {title.toLowerCase()}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={Colors.primary}
                  style={{ marginLeft: 4 }}
                />
              </Pressable>
            ) : null}
          </>
        )}
      </Card>
    </View>
  );
}
