import { View, Text, Image, Dimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { DisplayFontFamily } from '@/constants/typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
// Hero takes ~40% of the screen on welcome.
const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.4);

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      {/* PLACEHOLDER: founder is generating a custom hero illustration matching
          the icon style. Swap this View for an Image source={require('../../assets/images/welcome-hero.png')}
          when the asset lands. */}
      <View
        testID="welcome-hero"
        accessibilityLabel="Bemy hero illustration"
        style={{
          height: HERO_HEIGHT,
          width: '100%',
          backgroundColor: Colors.brandYellow,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={require('../../assets/images/icon.png')}
          style={{
            width: HERO_HEIGHT * 0.5,
            height: HERO_HEIGHT * 0.5,
          }}
          resizeMode="contain"
        />
      </View>

      <View className="flex-1 px-8 pt-10 items-center">
        <Text
          style={{
            fontFamily: DisplayFontFamily.bold,
            fontSize: 44,
            lineHeight: 48,
            color: Colors.primary,
            marginBottom: 12,
          }}
        >
          Bemy
        </Text>
        <Text className="text-body text-text-secondary text-center mb-10">
          A digital home for your pet family.
        </Text>

        <View className="w-full mb-5">
          <Button
            title="Get Started"
            onPress={() => router.push('/(auth)/sign-up')}
            variant="brandYellow"
          />
        </View>

        <Link href="/(auth)/sign-in">
          <Text className="text-primary text-callout font-medium">
            I already have an account
          </Text>
        </Link>
      </View>
    </View>
  );
}
