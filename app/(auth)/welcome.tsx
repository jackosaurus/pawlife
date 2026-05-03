import { useRef } from 'react';
import { View, Text, Image, Dimensions, Pressable } from 'react-native';
import { Button } from '@/components/ui/Button';
import { AuthSheet, AuthSheetHandle } from '@/components/auth/AuthSheet';
import { Colors } from '@/constants/colors';
import { DisplayFontFamily } from '@/constants/typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
// Hero takes ~40% of the screen on welcome.
const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.4);

export default function WelcomeScreen() {
  const sheetRef = useRef<AuthSheetHandle>(null);

  const openSignUp = () => sheetRef.current?.open('signup');
  const openSignIn = () => sheetRef.current?.open('signin');

  return (
    <View className="flex-1 bg-background">
      <Image
        testID="welcome-hero"
        accessibilityLabel="Bemy hero illustration"
        source={require('../../assets/images/welcome-hero.png')}
        style={{
          height: HERO_HEIGHT,
          width: '100%',
        }}
        // `contain` left visible left/right gaps on phones where screen width
        // exceeds hero height. `cover` fills the whole hero area; the cat+dog
        // are roughly centered vertically in the source so the small top/bottom
        // crop keeps them fully visible. Founder ask May 3 2026.
        resizeMode="cover"
      />

      <View className="flex-1 px-8 pt-10 items-center">
        <Text
          accessibilityRole="header"
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
            onPress={openSignUp}
            variant="brandYellow"
          />
        </View>

        <Pressable
          onPress={openSignIn}
          testID="welcome-signin-link"
          accessibilityRole="button"
          accessibilityLabel="I already have an account"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text className="text-primary text-callout font-medium">
            I already have an account
          </Text>
        </Pressable>
      </View>

      <AuthSheet ref={sheetRef} />
    </View>
  );
}
