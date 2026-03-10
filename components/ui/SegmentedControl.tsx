import { Pressable, Text, View } from 'react-native';

interface Option {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: Option[];
  selected: string;
  onSelect: (value: string) => void;
}

export function SegmentedControl({
  options,
  selected,
  onSelect,
}: SegmentedControlProps) {
  return (
    <View className="flex-row bg-white rounded-xl p-1 border border-border">
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            className={`flex-1 py-2.5 rounded-lg items-center ${
              isSelected ? 'bg-primary' : ''
            }`}
            testID={`segment-${option.value}`}
          >
            <Text
              className={`text-sm font-medium ${
                isSelected ? 'text-white' : 'text-text-primary'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
