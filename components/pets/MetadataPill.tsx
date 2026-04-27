import { View, Text } from 'react-native';

interface MetadataPillProps {
  label: string;
}

export function MetadataPill({ label }: MetadataPillProps) {
  return (
    <View
      className="bg-white rounded-full px-4 py-2"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <Text className="text-footnote font-semibold text-text-primary">{label}</Text>
    </View>
  );
}
