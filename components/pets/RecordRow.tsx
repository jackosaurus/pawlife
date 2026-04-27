import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusPill } from '@/components/ui/StatusPill';
import { Colors } from '@/constants/colors';

interface RecordRowProps {
  title: string;
  subtitle?: string;
  trailing?: string;
  status?: 'green' | 'amber' | 'overdue' | 'neutral';
  statusLabel?: string;
  onPress: () => void;
  showTopBorder?: boolean;
}

export function RecordRow({
  title,
  subtitle,
  trailing,
  status,
  statusLabel,
  onPress,
  showTopBorder = true,
}: RecordRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`py-4 ${showTopBorder ? 'border-t border-border' : ''}`}
      testID="record-row"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-headline text-text-primary">
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-callout text-text-secondary mt-0.5">
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View className="flex-row items-center gap-2">
          {trailing ? (
            <Text className="text-callout text-text-secondary">{trailing}</Text>
          ) : null}
          {status && statusLabel ? (
            <StatusPill label={statusLabel} status={status} />
          ) : null}
          <Ionicons
            name="chevron-forward"
            size={16}
            color={Colors.textSecondary}
          />
        </View>
      </View>
    </Pressable>
  );
}
