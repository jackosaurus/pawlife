import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, SignInFormData } from '@/types/auth';
import { useAuthStore } from '@/stores/authStore';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';

export default function SignInScreen() {
  const { signIn, loading, error, clearError } = useAuthStore();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: SignInFormData) => {
    clearError();
    await signIn(data.email, data.password);
  };

  return (
    <Screen scroll>
      <View className="flex-1 px-8 pt-16">
        <Text className="text-largeTitle text-text-primary mb-2">
          Welcome Back
        </Text>
        <Text className="text-body text-text-secondary mb-8">
          Sign in to continue
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
              placeholder="Enter your password"
              secureTextEntry
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              error={errors.password?.message}
            />
          )}
        />

        <View className="mt-4">
          <Button
            title="Sign In"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
          />
        </View>

        <View className="items-center mt-6">
          <Link href="/(auth)/sign-up">
            <Text className="text-primary text-callout font-medium">
              Don't have an account? Get Started
            </Text>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
