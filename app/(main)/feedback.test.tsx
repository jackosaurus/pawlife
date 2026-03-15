import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import FeedbackScreen from './feedback';
import { feedbackService } from '@/services/feedbackService';
import { Alert } from 'react-native';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
  }),
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({
      session: {
        user: { id: 'user-1', email: 'test@example.com' },
      },
    }),
}));

jest.mock('@/services/feedbackService', () => ({
  feedbackService: {
    submit: jest.fn(),
  },
}));

jest.mock('expo-constants', () => ({
  expoConfig: { version: '1.0.0' },
}));

jest.mock('expo-device', () => ({
  modelName: 'iPhone 15',
  osName: 'iOS',
  osVersion: '18.0',
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('@/constants/colors', () => ({
  Colors: {
    textPrimary: '#2D2A26',
    textSecondary: '#7A756E',
    primary: '#4A2157',
    border: '#EDE8DF',
    background: '#FFF8E7',
  },
}));

describe('FeedbackScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with category and description', () => {
    const { getByText, getByTestId } = render(<FeedbackScreen />);
    expect(getByText('Send Feedback')).toBeTruthy();
    expect(getByText('Category')).toBeTruthy();
    expect(getByText('Bug')).toBeTruthy();
    expect(getByText('Idea')).toBeTruthy();
    expect(getByTestId('description-input')).toBeTruthy();
  });

  it('disables Send button when description is empty', () => {
    const { getByTestId } = render(<FeedbackScreen />);
    const sendButton = getByTestId('send-button');
    fireEvent.press(sendButton);
    expect(feedbackService.submit).not.toHaveBeenCalled();
  });

  it('submits feedback with description', async () => {
    (feedbackService.submit as jest.Mock).mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert');

    const { getByTestId } = render(<FeedbackScreen />);

    fireEvent.changeText(getByTestId('description-input'), 'App crashes on add pet');

    await act(async () => {
      fireEvent.press(getByTestId('send-button'));
    });

    await waitFor(() => {
      expect(feedbackService.submit).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'App crashes on add pet',
          user_id: 'user-1',
          user_email: 'test@example.com',
          app_version: '1.0.0',
          device_model: 'iPhone 15',
          os_name: 'iOS',
          os_version: '18.0',
          screen_name: 'settings',
        }),
      );
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Thanks!',
      'Your feedback has been sent.',
      expect.any(Array),
    );
  });

  it('submits feedback with category selected', async () => {
    (feedbackService.submit as jest.Mock).mockResolvedValue(undefined);
    jest.spyOn(Alert, 'alert');

    const { getByTestId } = render(<FeedbackScreen />);

    fireEvent.press(getByTestId('segment-bug'));
    fireEvent.changeText(getByTestId('description-input'), 'Crash on save');

    await act(async () => {
      fireEvent.press(getByTestId('send-button'));
    });

    await waitFor(() => {
      expect(feedbackService.submit).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'bug',
          description: 'Crash on save',
        }),
      );
    });
  });

  it('shows error alert on submit failure', async () => {
    (feedbackService.submit as jest.Mock).mockRejectedValue(new Error('Network error'));
    jest.spyOn(Alert, 'alert');

    const { getByTestId } = render(<FeedbackScreen />);

    fireEvent.changeText(getByTestId('description-input'), 'Some feedback');

    await act(async () => {
      fireEvent.press(getByTestId('send-button'));
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to send feedback. Please try again.',
      );
    });
  });
});
