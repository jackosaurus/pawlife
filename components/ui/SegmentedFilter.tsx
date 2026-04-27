import { ScrollView, Pressable, Text } from 'react-native';
import { Colors } from '@/constants/colors';

interface SegmentedFilterProps {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

export function SegmentedFilter({
  options,
  selected,
  onSelect,
}: SegmentedFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 4 }}
      className="mb-4"
    >
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            className={`px-4 py-2 rounded-full mr-2 ${
              isSelected ? 'bg-primary' : 'bg-white border border-border'
            }`}
            testID={`filter-${option.value}`}
          >
            <Text
              className={`text-button-sm ${
                isSelected ? 'text-white' : 'text-text-secondary'
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
