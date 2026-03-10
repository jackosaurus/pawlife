import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatDate } from '@/utils/dates';

interface RecordCardProps {
  title: string;
  subtitle?: string;
  date: string;
  status?: 'green' | 'amber' | 'overdue';
  statusLabel?: string;
  onPress: () => void;
}

export function RecordCard({
  title,
  subtitle,
  date,
  status,
  statusLabel,
  onPress,
}: RecordCardProps) {
  return (
    <Card className="p-4 mb-3" onPress={onPress}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-base font-semibold text-text-primary">
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-sm text-text-secondary mt-0.5">
              {subtitle}
            </Text>
          ) : null}
          <Text className="text-xs text-text-secondary mt-1">
            {formatDate(date)}
          </Text>
        </View>
        {status && statusLabel ? (
          <StatusPill label={statusLabel} status={status} />
        ) : null}
      </View>
    </Card>
  );
}
