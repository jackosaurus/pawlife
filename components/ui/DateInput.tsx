import { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { formatDate } from '@/utils/dates';

interface DateInputProps {
  label: string;
  value: string | null;
  onChange: (dateString: string) => void;
  error?: string;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}

export function DateInput({
  label,
  value,
  onChange,
  error,
  placeholder = 'Select date',
  maximumDate,
  minimumDate,
}: DateInputProps) {
  const [show, setShow] = useState(false);

  const { parsedDate, isValidDate } = (() => {
    if (!value) return { parsedDate: new Date(), isValidDate: false };
    const parts = value.split('-').map(Number);
    const [y, m, d] = parts;
    if (!y || !m || !d || parts.length !== 3) {
      return { parsedDate: new Date(), isValidDate: false };
    }
    const date = new Date(y, m - 1, d);
    return { parsedDate: date, isValidDate: !isNaN(date.getTime()) };
  })();

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    }
  };

  const borderColor = error
    ? Colors.statusOverdue
    : show
      ? Colors.primary
      : Colors.border;

  return (
    <View className="mb-4">
      <Text className="text-text-secondary text-body mb-1.5">{label}</Text>
      <Pressable
        onPress={() => setShow(true)}
        style={{ borderColor, borderWidth: 1, borderRadius: 12 }}
        className="flex-row items-center bg-white px-4 py-3.5"
        testID="date-input-trigger"
      >
        <Text
          className={`flex-1 text-body ${
            isValidDate ? 'text-text-primary' : 'text-text-secondary'
          }`}
        >
          {isValidDate ? formatDate(value!) : placeholder}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={20}
          color={Colors.textSecondary}
        />
      </Pressable>
      {error ? (
        <Text className="text-status-overdue text-footnote mt-1">{error}</Text>
      ) : null}
      {show && (
        <View testID="date-picker">
          <DateTimePicker
            value={isValidDate ? parsedDate : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
          />
          {Platform.OS === 'ios' && (
            <Pressable
              onPress={() => setShow(false)}
              className="items-center py-2"
              testID="date-picker-done"
            >
              <Text className="text-primary text-headline">Done</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
