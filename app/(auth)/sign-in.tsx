import { useState } from 'react';
import {
  View,
  Text,
  Image,
  Dimensions,
  Pressable,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, SignInFormData } from '@/types/auth';
import { useAuthStore } from '@/stores/authStore';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { DisplayFontFamily } from '@/constants/typography';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
// Smaller hero on sign-in: ~20% of the screen.
const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.2);

export default function SignInScreen() {
  const { signIn, resetPassword, loading, error, clearError } = useAuthStore();
  const [resetSent, setResetSent] = useState(false);
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  // Hook for surfacing the cached "last user's name" in a future PR. Today
  // we always render the generic copy; the founder's caching mechanism will
  // hydrate `cachedDisplayName` on app boot.
  const cachedDisplayName: string | null = null;
  const headline = cachedDisplayName
    ? `Welcome back, ${cachedDisplayName}`
    : 'Welcome back';

  const onSubmit = async (data: SignInFormData) => {
    clearError();
    await signIn(data.email, data.password);
  };

  const onForgotPassword = async () => {
    clearError();
    const email = getValues('email').trim();
    if (!email) {
      Alert.alert(
        'Enter your email',
        'Type the email you signed up with above, then tap "Forgot password?" again.',
      );
      return;
    }
    try {
      await resetPassword(email);
      setResetSent(true);
      Alert.alert(
        'Check your inbox',
        `We've sent a password reset link to ${email}.`,
      );
    } catch {
      // Error already surfaced via authStore.error; no-op here.
    }
  };

  return (
    <Screen scroll>
      {/* PLACEHOLDER: founder is generating a custom hero illustration matching
          the icon style. Swap this View for an Image source={require('../../assets/images/welcome-hero.png')}
          when the asset lands. */}
      <View
        testID="signin-hero"
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
            width: HERO_HEIGHT * 0.7,
            height: HERO_HEIGHT * 0.7,
          }}
          resizeMode="contain"
        />
      </View>

      <View className="flex-1 px-8 pt-8">
        <Text
          style={{
            fontFamily: DisplayFontFamily.bold,
            fontSize: 32,
            lineHeight: 38,
            color: Colors.textPrimary,
            marginBottom: 8,
          }}
        >
          {headline}
        </Text>
        <Text className="text-body text-text-secondary mb-8">
          Sign in to continue.
        </Text>

        {error && (
          <View className="bg-status-overdue/10 rounded-xl px-4 py-3 mb-4">
            <Text className="text-status-overdue text-footnote">{error}</Text>
          </View>
        )}

        {resetSent && !error && (
          <View
            testID="reset-sent-banner"
            className="bg-status-green/10 rounded-xl px-4 py-3 mb-4"
          >
            <Text className="text-status-green text-footnote">
              Password reset link sent. Check your inbox.
            </Text>
          </View>
        )}

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.password?.message}
            />
          )}
        />

        <View className="items-end -mt-2 mb-4">
          <Pressable
            onPress={onForgotPassword}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            testID="forgot-password-link"
            accessibilityRole="button"
            accessibilityLabel="Forgot password?"
          >
            <Text className="text-primary text-footnote font-medium">
              Forgot password?
            </Text>
          </Pressable>
        </View>

        <View className="mt-2">
          <Button
            title="Sign in"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            variant="brandYellow"
          />
        </View>

        <View className="items-center mt-6">
          <Link href="/(auth)/sign-up">
            <Text className="text-primary text-callout font-medium">
              Don&apos;t have an account? Get started
            </Text>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
