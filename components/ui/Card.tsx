import { Pressable, View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
}

const shadowStyle: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 2,
};

export function Card({ children, className, onPress }: CardProps) {
  const baseClass = `bg-card rounded-card ${className ?? ''}`;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={baseClass}
        style={shadowStyle}
        testID="card"
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={baseClass} style={shadowStyle} testID="card">
      {children}
    </View>
  );
}
