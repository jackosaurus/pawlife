import { View, Text } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <Text className="text-display text-text-primary mb-4">
        Bemy
      </Text>
      <Text className="text-body text-text-secondary text-center mb-12">
        A digital home for your pet family
      </Text>
      <View className="w-full mb-4">
        <Button
          title="Get Started"
          onPress={() => router.push('/(auth)/sign-up')}
        />
      </View>
      <Link href="/(auth)/sign-in">
        <Text className="text-primary text-callout font-medium">Sign In</Text>
      </Link>
    </View>
  );
}
