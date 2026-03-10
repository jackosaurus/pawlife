import { View, Text } from 'react-native';
import { Colors } from '@/constants/colors';

interface StatusPillProps {
  label: string;
  status: 'green' | 'amber' | 'overdue';
}

const statusColors = {
  green: { bg: Colors.statusGreen, text: Colors.statusGreen },
  amber: { bg: Colors.statusAmber, text: Colors.statusAmber },
  overdue: { bg: Colors.statusOverdue, text: Colors.statusOverdue },
} as const;

export function StatusPill({ label, status }: StatusPillProps) {
  const { bg, text } = statusColors[status];

  return (
    <View
      style={{ backgroundColor: `${bg}15` }}
      className="px-3 py-1 rounded-full"
      testID={`status-pill-${status}`}
    >
      <Text style={{ color: text }} className="text-xs font-semibold">
        {label}
      </Text>
    </View>
  );
}
