import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';

interface RecordCardProps {
  title: string;
  subtitle?: string;
  detail?: string;
  date: string;
  status?: 'green' | 'amber' | 'overdue' | 'neutral';
  statusLabel?: string;
  onPress: () => void;
}

function parseDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDate();
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  return { day, month, year };
}

export function RecordCard({
  title,
  subtitle,
  detail,
  date,
  status,
  statusLabel,
  onPress,
}: RecordCardProps) {
  const { day, month, year } = parseDate(date);

  return (
    <Card className="p-4 mb-3" onPress={onPress}>
      <View className="flex-row">
        <View className="items-center mr-4" style={{ width: 44 }}>
          <Text className="text-2xl font-bold text-primary leading-tight">
            {day}
          </Text>
          <Text className="text-footnote font-semibold text-text-secondary uppercase">
            {month}
          </Text>
          <Text className="text-footnote text-text-secondary">
            {year}
          </Text>
        </View>
        <View className="flex-1 justify-center">
          <View className="flex-row items-center justify-between">
            <Text className="text-headline text-text-primary flex-1 mr-2" numberOfLines={1}>
              {title}
            </Text>
            {status && statusLabel ? (
              <StatusPill label={statusLabel} status={status} />
            ) : null}
          </View>
          {subtitle ? (
            <Text className="text-callout text-text-secondary mt-1" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          {detail ? (
            <Text className="text-callout text-text-secondary mt-0.5" numberOfLines={1}>
              {detail}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}
