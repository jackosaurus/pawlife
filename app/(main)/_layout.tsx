import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFF8E7' },
      }}
    >
      <Stack.Screen
        name="menu"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.45, 0.9],
          sheetGrabberVisible: true,
          headerShown: false,
        }}
      />
    </Stack>
  );
}
