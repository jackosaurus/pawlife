import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusCardLayout } from '@/components/ui/StatusCardLayout';
import { Colors } from '@/constants/colors';
import { Vaccination } from '@/types';
import { getVaccinationStatus } from '@/utils/status';
import { getIntervalLabel } from '@/constants/vaccines';
import { formatDistanceToNow } from '@/utils/dates';

interface VaccinationCardProps {
  vaccination: Vaccination;
  onPress: () => void;
  onLog?: () => void;
  logLoading?: boolean;
}

type IndicatorColor = 'green' | 'amber' | 'red' | 'gray';

const indicatorColors = {
  green: Colors.statusGreen,
  amber: Colors.statusAmber,
  red: Colors.statusOverdue,
  gray: Colors.statusNeutral,
} as const;

interface IndicatorProps {
  type: 'check' | 'dot';
  color: IndicatorColor;
}

function StatusIndicator({ type, color }: IndicatorProps) {
  const resolvedColor = indicatorColors[color];

  if (type === 'check') {
    return (
      <View
        testID="indicator-check"
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: resolvedColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View
      testID="indicator-dot"
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: resolvedColor,
      }}
    />
  );
}

function getIndicator(
  vaccination: Vaccination,
  status: 'green' | 'amber' | 'overdue',
): IndicatorProps {
  if (!vaccination.date_administered) {
    return { type: 'dot', color: 'gray' };
  }

  if (status === 'green') {
    return { type: 'check', color: 'green' };
  }

  if (status === 'amber') {
    return { type: 'dot', color: 'amber' };
  }

  // overdue
  return { type: 'dot', color: 'red' };
}

function getContextText(
  vaccination: Vaccination,
  status: 'green' | 'amber' | 'overdue',
): string {
  if (!vaccination.date_administered) {
    return 'Not yet given';
  }

  if (status === 'green') {
    const distance = formatDistanceToNow(vaccination.date_administered);
    return distance === 'today' ? 'Given today' : `Given ${distance}`;
  }

  if (status === 'amber') {
    return 'Due soon';
  }

  return 'Overdue';
}

export function VaccinationCard({
  vaccination,
  onPress,
  onLog,
  logLoading,
}: VaccinationCardProps) {
  const status = getVaccinationStatus(vaccination.next_due_date);
  const indicator = getIndicator(vaccination, status);
  const contextText = getContextText(vaccination, status);
  const showLog =
    (status !== 'green' || !vaccination.date_administered) && !!onLog;

  return (
    <StatusCardLayout
      onPress={onPress}
      left={
        <>
          <Text
            className="text-headline text-text-primary"
            numberOfLines={1}
          >
            {vaccination.vaccine_name}
          </Text>
          <Text
            className="text-callout text-text-secondary mt-0.5"
            numberOfLines={1}
          >
            {getIntervalLabel(vaccination.interval_months)}
          </Text>
        </>
      }
      indicator={
        <StatusIndicator type={indicator.type} color={indicator.color} />
      }
      rightBelow={
        <>
          <Text
            className="text-footnote text-text-secondary mt-1 text-center"
            numberOfLines={1}
          >
            {contextText}
          </Text>
          {showLog ? (
            <Pressable
              onPress={() => onLog!()}
              disabled={logLoading}
              hitSlop={12}
              testID="log-button"
              accessibilityRole="button"
              accessibilityLabel="Log vaccination"
              className="mt-1 px-3 py-1 rounded-full"
              style={{ backgroundColor: `${Colors.primary}1A` }}
            >
              {logLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text className="text-button-sm text-primary">
                  Log
                </Text>
              )}
            </Pressable>
          ) : null}
        </>
      }
    />
  );
}
