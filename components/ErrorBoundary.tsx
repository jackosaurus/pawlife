/**
 * ErrorBoundary — catches render errors anywhere in the React tree below it
 * and reports them to PostHog via observabilityService.captureException. Per
 * reviewer amendment §6: React Native does NOT export an ErrorBoundary
 * primitive. This file is the canonical one; mount it at the root in
 * app/_layout.tsx.
 *
 * Class component is required — only class components can implement
 * componentDidCatch / getDerivedStateFromError.
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { observabilityService } from '@/services/observabilityService';
import { Colors } from '@/constants/colors';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    observabilityService.captureException(error, {
      extra: { componentStack: info.componentStack ?? '' },
    });
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <View
          testID="error-boundary-fallback"
          style={{
            flex: 1,
            backgroundColor: Colors.background,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: '600',
              color: Colors.textPrimary,
              marginBottom: 8,
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: Colors.textSecondary,
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            We hit an unexpected error. Tap below to retry.
          </Text>
          <Pressable
            onPress={this.reset}
            testID="error-boundary-retry"
            style={{
              backgroundColor: Colors.primary,
              paddingVertical: 14,
              paddingHorizontal: 32,
              borderRadius: 16,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
              Try again
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
