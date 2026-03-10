import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { Colors } from '@/constants/colors';
import { Vaccination } from '@/types';
import { getVaccinationStatus } from '@/utils/status';

const STATUS_LABELS: Record<'green' | 'amber' | 'overdue', string> = {
  green: 'Up to date',
  amber: 'Due soon',
  overdue: 'Overdue',
};

interface HealthSummaryCardProps {
  petName: string;
  vaccinations?: Vaccination[];
  onPress?: () => void;
  onAddRecord?: () => void;
}

export function HealthSummaryCard({
  petName,
  vaccinations,
  onPress,
  onAddRecord,
}: HealthSummaryCardProps) {
  const hasRecords = vaccinations && vaccinations.length > 0;

  if (!hasRecords) {
    return (
      <Card className="p-5 mb-4" onPress={onPress}>
        <View className="flex-row items-center mb-3">
          <Ionicons name="heart-outline" size={20} color={Colors.primary} />
          <Text className="text-base font-semibold text-text-primary ml-2">
            Health Summary
          </Text>
        </View>
        <View className="items-center py-4">
          <Ionicons name="medical-outline" size={36} color={Colors.textSecondary} />
          <Text className="text-text-secondary text-sm text-center mt-2">
            No health records yet.{'\n'}Start building {petName}'s health history!
          </Text>
          {onAddRecord && (
            <Pressable onPress={onAddRecord} className="mt-3" testID="add-health-record">
              <Text className="text-primary font-medium text-sm">
                Add first record
              </Text>
            </Pressable>
          )}
        </View>
      </Card>
    );
  }

  // Compute worst vaccination status
  const statuses = vaccinations.map((v) => getVaccinationStatus(v.next_due_date));
  const overdue = statuses.filter((s) => s === 'overdue').length;
  const amber = statuses.filter((s) => s === 'amber').length;

  const worstStatus: 'green' | 'amber' | 'overdue' = overdue > 0
    ? 'overdue'
    : amber > 0
      ? 'amber'
      : 'green';

  // Build summary line
  const summaryParts: string[] = [];
  if (overdue > 0) summaryParts.push(`${overdue} overdue`);
  if (amber > 0) summaryParts.push(`${amber} due soon`);
  const upToDate = statuses.filter((s) => s === 'green').length;
  if (upToDate > 0) summaryParts.push(`${upToDate} up to date`);

  return (
    <Card className="mb-4 overflow-hidden" onPress={onPress}>
      <View
        className="flex-row"
        style={{
          borderLeftWidth: 4,
          borderLeftColor:
            worstStatus === 'overdue'
              ? Colors.statusOverdue
              : worstStatus === 'amber'
                ? Colors.statusAmber
                : Colors.statusGreen,
        }}
      >
        <View className="flex-1 p-5">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Ionicons name="heart-outline" size={20} color={Colors.primary} />
              <Text className="text-base font-semibold text-text-primary ml-2">
                Health Summary
              </Text>
            </View>
            <StatusPill label={STATUS_LABELS[worstStatus]} status={worstStatus} />
          </View>

          <Text className="text-sm text-text-primary font-medium" testID="vaccination-count">
            {vaccinations.length} vaccination{vaccinations.length !== 1 ? 's' : ''}
          </Text>
          <Text className="text-xs text-text-secondary mt-1" testID="vaccination-summary">
            {summaryParts.join(' · ')}
          </Text>

          <Pressable onPress={onPress} className="mt-3" testID="view-health-records">
            <Text className="text-primary font-medium text-sm">
              View all records
            </Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}
