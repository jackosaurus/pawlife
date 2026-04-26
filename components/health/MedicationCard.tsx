import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { MedicationWithDoseInfo } from '@/hooks/useMedications';
import { getRecurringMedicationStatus, getOneOffMedicationStatus } from '@/utils/status';
import {
  getMedicationIndicator,
  getMedicationContextText,
  shouldShowLogDose,
  MedicationIndicator,
} from '@/utils/medications';
import {
  getMedicationStaleness,
  humanizedDuration,
} from '@/utils/medicationStaleness';

interface MedicationCardProps {
  medication: MedicationWithDoseInfo;
  onPress: () => void;
  onLogDose?: () => void;
  logDoseLoading?: boolean;
  onArchive?: () => void;
}

const indicatorColors = {
  green: Colors.statusGreen,
  amber: Colors.statusAmber,
  red: Colors.statusOverdue,
  gray: Colors.statusNeutral,
} as const;

function StatusIndicator({ indicator }: { indicator: MedicationIndicator }) {
  const color = indicatorColors[indicator.color];

  if (indicator.type === 'check') {
    return (
      <View
        testID="indicator-check"
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
      </View>
    );
  }

  if (indicator.type === 'fraction') {
    return (
      <Text
        testID="indicator-fraction"
        style={{ color, fontSize: 16, fontWeight: '700', textAlign: 'center' }}
      >
        {indicator.fractionText}
      </Text>
    );
  }

  // dot
  return (
    <View
      testID="indicator-dot"
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color,
      }}
    />
  );
}

export function MedicationCard({
  medication,
  onPress,
  onLogDose,
  logDoseLoading,
  onArchive,
}: MedicationCardProps) {
  const status = medication.isRecurring
    ? getRecurringMedicationStatus(
        medication.lastGivenDate,
        medication.frequency!,
        medication.todayDoseCount,
        medication.dosesPerDay,
      )
    : getOneOffMedicationStatus(medication.end_date);

  const indicator = getMedicationIndicator(medication, status);
  const contextText = getMedicationContextText(medication, status);
  const showLogDose = shouldShowLogDose(medication, status) && !!onLogDose;

  // Stale prompt: derived from current data, no extra state.
  const stale = getMedicationStaleness(
    medication,
    medication.lastGivenDate,
    new Date(),
  );

  const stalePromptText = (() => {
    if (!stale.reason || stale.daysSince == null) return null;
    const duration = humanizedDuration(stale.daysSince);
    if (stale.reason === 'end_date_passed') {
      return `This course ended ${duration} ago — archive?`;
    }
    return `Last logged ${duration} ago — archive?`;
  })();

  const handleStalePromptPress = () => {
    if (!onArchive) return;
    Alert.alert(
      'Archive medication?',
      `Archive ${medication.name}? It'll move out of active medications. You can restore it anytime.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Archive', onPress: onArchive },
      ],
    );
  };

  return (
    <Card className="p-4 mb-3" onPress={onPress}>
      <View className="flex-row">
        {/* Left: medication info */}
        <View className="flex-1 justify-center mr-3">
          <Text
            className="text-headline text-text-primary"
            numberOfLines={1}
          >
            {medication.name}
          </Text>
          <Text
            className="text-callout text-text-secondary mt-0.5"
            numberOfLines={1}
          >
            {[medication.dosage, medication.frequency].filter(Boolean).join(' · ')}
          </Text>
        </View>

        {/* Right: status indicator + context + Log Dose */}
        <View className="items-center justify-center" style={{ minWidth: 96 }}>
          <StatusIndicator indicator={indicator} />
          <Text
            className="text-footnote text-text-secondary mt-1 text-center"
            numberOfLines={1}
          >
            {contextText}
          </Text>
          {showLogDose ? (
            <Pressable
              onPress={() => onLogDose!()}
              disabled={logDoseLoading}
              hitSlop={8}
              testID="log-dose-button"
              accessibilityRole="button"
              accessibilityLabel="Log dose"
              className="mt-2 px-4 py-2.5 rounded-full"
              style={{ backgroundColor: `${Colors.primary}1A` }}
            >
              {logDoseLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text className="text-button-sm text-primary">
                  Log Dose
                </Text>
              )}
            </Pressable>
          ) : null}
        </View>
      </View>

      {stalePromptText ? (
        <Pressable
          onPress={handleStalePromptPress}
          hitSlop={4}
          testID="stale-prompt"
          className="mt-3"
        >
          <Text
            style={{ color: Colors.textSecondary }}
            className="text-footnote"
            numberOfLines={2}
          >
            {stalePromptText}
          </Text>
        </Pressable>
      ) : null}
    </Card>
  );
}
