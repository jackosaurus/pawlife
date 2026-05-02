import { useState } from 'react';
import { View, Text, Pressable, Image, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as WebBrowser from 'expo-web-browser';
import { signUpSchema, SignUpFormData } from '@/types/auth';
import { useAuthStore } from '@/stores/authStore';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { DisplayFontFamily } from '@/constants/typography';
import { PRIVACY_POLICY_URL } from '@/constants/legal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.2);

export default function SignUpScreen() {
  const { signUp, loading, error, clearError } = useAuthStore();
  const [consented, setConsented] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setConsentError(null);
    clearError();
    await signUp(data.email, data.password);
  };

  // Always-enabled CTA pattern: tapping "Create account" first checks the
  // privacy gate and surfaces an inline error if the checkbox isn't ticked,
  // then defers to react-hook-form's validated submit. Avoids the dead-button
  // confusion the design review flagged.
  const onCreatePressed = () => {
    if (!consented) {
      setConsentError('Please agree to the Privacy Policy to continue.');
      return;
    }
    setConsentError(null);
    void handleSubmit(onSubmit)();
  };

  const openPrivacyPolicy = () => {
    void WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL);
  };

  return (
    <Screen scroll>
      {/* PLACEHOLDER: founder is generating a custom hero illustration matching
          the icon style. Swap this View for an Image source={require('../../assets/images/welcome-hero.png')}
          when the asset lands. */}
      <View
        testID="signup-hero"
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
            fontSize: 30,
            lineHeight: 36,
            color: Colors.textPrimary,
            marginBottom: 8,
          }}
        >
          Add your first furry family member
        </Text>
        <Text className="text-body text-text-secondary mb-8">
          Start building their story.
        </Text>

        {error && (
          <View className="bg-status-overdue/10 rounded-xl px-4 py-3 mb-4">
            <Text className="text-status-overdue text-footnote">{error}</Text>
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
              placeholder="At least 8 characters"
              secureTextEntry
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.password?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Confirm Password"
              placeholder="Re-enter your password"
              secureTextEntry
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.confirmPassword?.message}
            />
          )}
        />

        {/* Explicit consent — reviewer amendment §8. Now using the
            "always-enabled CTA, helpful inline error if blocker present"
            pattern (auth-screen redesign brief). */}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consented }}
          accessibilityLabel="I agree to the Privacy Policy"
          onPress={() => {
            setConsented((v) => !v);
            setConsentError(null);
          }}
          testID="privacy-consent-checkbox"
          className="flex-row items-center mt-4"
        >
          <View
            className="w-6 h-6 rounded-md mr-3 items-center justify-center"
            style={{
              borderWidth: 1.5,
              borderColor: consented ? Colors.primary : Colors.border,
              backgroundColor: consented ? Colors.primary : Colors.card,
            }}
          >
            {consented && (
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>✓</Text>
            )}
          </View>
          <Text className="text-footnote text-text-secondary flex-1">
            I agree to the{' '}
            <Text
              testID="privacy-policy-link"
              onPress={openPrivacyPolicy}
              className="text-primary font-medium underline"
            >
              Privacy Policy
            </Text>
          </Text>
        </Pressable>

        {consentError && (
          <Text
            testID="consent-error"
            className="text-status-overdue text-footnote mt-2"
          >
            {consentError}
          </Text>
        )}

        <View className="mt-4">
          <Button
            title="Create account"
            onPress={onCreatePressed}
            loading={loading}
            variant="brandYellow"
            // Always enabled — onCreatePressed guards on `consented` and
            // surfaces an inline error if the checkbox isn't ticked.
          />
        </View>

        <View className="items-center mt-6">
          <Link href="/(auth)/sign-in">
            <Text className="text-primary text-callout font-medium">
              Already have an account? Sign in
            </Text>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
