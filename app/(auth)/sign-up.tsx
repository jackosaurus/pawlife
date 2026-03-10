import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, SignUpFormData } from '@/types/auth';
import { useAuthStore } from '@/stores/authStore';
import { Screen } from '@/components/ui/Screen';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';

export default function SignUpScreen() {
  const { signUp, loading, error, clearError } = useAuthStore();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: SignUpFormData) => {
    clearError();
    await signUp(data.email, data.password);
  };

  return (
    <Screen scroll>
      <View className="flex-1 px-8 pt-16">
        <Text className="text-3xl font-bold text-text-primary mb-2">
          Create Account
        </Text>
        <Text className="text-base text-text-secondary mb-8">
          Sign up to start tracking your pet's health
        </Text>

        {error && (
          <View className="bg-status-overdue/10 rounded-xl px-4 py-3 mb-4">
            <Text className="text-status-overdue text-sm">{error}</Text>
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

        <View className="mt-4">
          <Button
            title="Create Account"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
          />
        </View>

        <View className="items-center mt-6">
          <Link href="/(auth)/sign-in">
            <Text className="text-primary text-base font-medium">
              Already have an account? Sign In
            </Text>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
