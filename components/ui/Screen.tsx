import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  className?: string;
}

export function Screen({ children, scroll, className }: ScreenProps) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className="flex-1">{children}</View>
  );

  return (
    <SafeAreaView className={`flex-1 bg-background ${className ?? ''}`}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
