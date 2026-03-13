import { View, Text } from 'react-native';

interface DetailRowProps {
  label: string;
  value: string;
  isLast?: boolean;
}

export function DetailRow({ label, value, isLast }: DetailRowProps) {
  return (
    <View
      className={`flex-row items-start justify-between py-4 ${
        isLast ? '' : 'border-b border-border'
      }`}
    >
      <Text className="text-base text-text-secondary flex-shrink-0 mr-4">
        {label}
      </Text>
      <Text className="text-base font-medium text-text-primary text-right flex-1 flex-shrink">
        {value}
      </Text>
    </View>
  );
}
