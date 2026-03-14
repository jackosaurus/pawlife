import { View, Text, Pressable, ActivityIndicator } from 'react-native';
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

interface MedicationCardProps {
  medication: MedicationWithDoseInfo;
  onPress: () => void;
  onLogDose?: () => void;
  logDoseLoading?: boolean;
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

  return (
    <Card className="p-4 mb-3" onPress={onPress}>
      <View className="flex-row">
        {/* Left: medication info */}
        <View className="flex-1 justify-center mr-3">
          <Text
            className="text-base font-semibold text-text-primary"
            numberOfLines={1}
          >
            {medication.name}
          </Text>
          <Text className="text-sm text-text-secondary mt-0.5" numberOfLines={1}>
            {[medication.dosage, medication.frequency].filter(Boolean).join(' · ')}
          </Text>
        </View>

        {/* Right: status indicator + context + Log Dose */}
        <View className="items-center justify-center" style={{ minWidth: 80 }}>
          <StatusIndicator indicator={indicator} />
          <Text
            className="text-xs text-text-secondary mt-1 text-center"
            numberOfLines={1}
          >
            {contextText}
          </Text>
          {showLogDose ? (
            <Pressable
              onPress={() => onLogDose!()}
              disabled={logDoseLoading}
              hitSlop={4}
              testID="log-dose-button"
              className="mt-1"
            >
              {logDoseLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text className="text-xs font-semibold text-primary">
                  Log Dose
                </Text>
              )}
            </Pressable>
          ) : null}
        </View>
      </View>
    </Card>
  );
}
