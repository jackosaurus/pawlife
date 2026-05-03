import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as WebBrowser from 'expo-web-browser';
import {
  signInSchema,
  signUpSchema,
  SignInFormData,
  SignUpFormData,
} from '@/types/auth';
import { useAuthStore } from '@/stores/authStore';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { DisplayFontFamily } from '@/constants/typography';
import { PRIVACY_POLICY_URL } from '@/constants/legal';

export type AuthTab = 'signin' | 'signup';

export interface AuthSheetHandle {
  open: (tab: AuthTab) => void;
  close: () => void;
}

interface AuthSheetProps {
  /**
   * Optional: callback when the sheet's index changes. Mostly useful for
   * tests + analytics; the sheet drives its own visibility otherwise.
   */
  onChange?: (index: number) => void;
}

export const AuthSheet = forwardRef<AuthSheetHandle, AuthSheetProps>(
  ({ onChange }, ref) => {
    const sheetRef = useRef<BottomSheet>(null);
    const [tab, setTab] = useState<AuthTab>('signup');

    // Snap points: 70% for sign-up (longer form), 60% for sign-in. We swap
    // the snapPoints array based on the active tab so the sheet sizes itself
    // to whichever form the user is on.
    const snapPoints = useMemo(
      () => (tab === 'signup' ? ['70%'] : ['60%']),
      [tab],
    );

    useImperativeHandle(
      ref,
      () => ({
        open: (nextTab: AuthTab) => {
          setTab(nextTab);
          sheetRef.current?.snapToIndex(0);
        },
        close: () => {
          sheetRef.current?.close();
        },
      }),
      [],
    );

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.4}
          pressBehavior="close"
        />
      ),
      [],
    );

    return (
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backdropComponent={renderBackdrop}
        onChange={onChange}
        backgroundStyle={{ backgroundColor: Colors.card }}
        handleIndicatorStyle={{ backgroundColor: Colors.border }}
        accessibilityLabel="Sign in or sign up"
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <AuthTabToggle tab={tab} onChange={setTab} />
            {tab === 'signup' ? (
              <SignUpForm />
            ) : (
              <SignInForm />
            )}
          </KeyboardAvoidingView>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

AuthSheet.displayName = 'AuthSheet';

// ---------------------------------------------------------------------------
// Tab toggle
// ---------------------------------------------------------------------------

interface AuthTabToggleProps {
  tab: AuthTab;
  onChange: (tab: AuthTab) => void;
}

function AuthTabToggle({ tab, onChange }: AuthTabToggleProps) {
  return (
    <View
      accessibilityRole="tablist"
      className="flex-row bg-background rounded-full p-1 mt-2 mb-5"
    >
      <TabPill
        label="Sign up"
        active={tab === 'signup'}
        onPress={() => onChange('signup')}
        testID="auth-tab-signup"
      />
      <TabPill
        label="Sign in"
        active={tab === 'signin'}
        onPress={() => onChange('signin')}
        testID="auth-tab-signin"
      />
    </View>
  );
}

interface TabPillProps {
  label: string;
  active: boolean;
  onPress: () => void;
  testID: string;
}

function TabPill({ label, active, onPress, testID }: TabPillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      testID={testID}
      className="flex-1 items-center justify-center py-2.5 rounded-full"
      style={{
        backgroundColor: active ? Colors.card : 'transparent',
      }}
    >
      <Text
        className={
          active
            ? 'text-primary text-callout font-semibold'
            : 'text-text-secondary text-callout font-medium'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Sign-up form
// ---------------------------------------------------------------------------

function SignUpForm() {
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

  // Always-enabled CTA pattern (per design system + previous engineer's
  // commit c6c790d): tap surfaces an inline error if the privacy checkbox
  // isn't ticked, then defers to react-hook-form's validated submit.
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
    <View testID="auth-sheet-signup">
      <Text
        accessibilityRole="header"
        style={{
          fontFamily: DisplayFontFamily.bold,
          fontSize: 28,
          lineHeight: 34,
          color: Colors.primary,
          marginBottom: 6,
        }}
      >
        Welcome to the family.
      </Text>
      <Text className="text-text-secondary mb-5" style={{ fontSize: 15, lineHeight: 22 }}>
        Beau, Remy, and the rest of the pack are excited to meet yours.
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
            autoComplete="email"
            textContentType="emailAddress"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.email?.message}
            testID="signup-email-input"
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
            autoComplete="password-new"
            textContentType="newPassword"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.password?.message}
            testID="signup-password-input"
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
            autoComplete="password-new"
            textContentType="newPassword"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.confirmPassword?.message}
            testID="signup-confirm-input"
          />
        )}
      />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: consented }}
        accessibilityLabel="I agree to the Privacy Policy"
        onPress={() => {
          setConsented((v) => !v);
          setConsentError(null);
        }}
        testID="privacy-consent-checkbox"
        className="flex-row items-center mt-3"
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
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Sign-in form
// ---------------------------------------------------------------------------

function SignInForm() {
  const { signIn, resetPassword, loading, error, clearError } = useAuthStore();
  const [resetSent, setResetSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: SignInFormData) => {
    clearError();
    setForgotError(null);
    await signIn(data.email, data.password);
  };

  const onForgotPassword = async () => {
    clearError();
    const email = getValues('email').trim();
    if (!email) {
      // Inline error replacement for the previous Alert.alert pattern (per
      // PM §6 item 4 + designer §5). Voice-aligned, non-destructive.
      setForgotError(
        'Type your email above first, then tap "Forgot?" again.',
      );
      return;
    }
    setForgotError(null);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch {
      // Error already surfaced via authStore.error.
    }
  };

  return (
    <View testID="auth-sheet-signin">
      <Text
        accessibilityRole="header"
        style={{
          fontFamily: DisplayFontFamily.bold,
          fontSize: 28,
          lineHeight: 34,
          color: Colors.primary,
          marginBottom: 6,
        }}
      >
        Welcome back.
      </Text>
      <Text className="text-text-secondary mb-5" style={{ fontSize: 15, lineHeight: 22 }}>
        Sign in to pick up where you left off.
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
            autoComplete="email"
            textContentType="emailAddress"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={(text) => {
              onChange(text);
              if (forgotError) setForgotError(null);
            }}
            onBlur={onBlur}
            value={value}
            error={errors.email?.message ?? forgotError ?? undefined}
            testID="signin-email-input"
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
            autoComplete="password"
            textContentType="password"
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.password?.message}
            testID="signin-password-input"
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
            Forgot?
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
    </View>
  );
}
