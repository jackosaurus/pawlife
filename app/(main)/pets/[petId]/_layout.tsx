import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function PetDetailLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFF8E7' },
        }}
      />
    </GestureHandlerRootView>
  );
}
