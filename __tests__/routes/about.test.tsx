import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AboutScreen from '../../app/(main)/about';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockImpactAsync = jest.fn().mockResolvedValue(undefined);

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: { [key: string]: unknown }) => <View {...props} />,
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: (...args: unknown[]) => mockImpactAsync(...args),
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('AboutScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the hero illustration and Bemy wordmark', () => {
    const { getByTestId, getByText } = render(<AboutScreen />);
    expect(getByTestId('about-hero')).toBeTruthy();
    expect(getByTestId('about-wordmark')).toBeTruthy();
    expect(getByText('Bemy')).toBeTruthy();
    expect(getByText('A digital home for your pet family.')).toBeTruthy();
  });

  it('renders all page sections including Origins of Bemy', () => {
    const { getByText } = render(<AboutScreen />);
    // §2 Hi, I'm Jack
    expect(getByText("Hi, I'm Jack")).toBeTruthy();
    // §3 Origins of Bemy (NEW)
    expect(getByText('Origins of Bemy')).toBeTruthy();
    // §4 Beau (heading is just the name now, no "Meet" prefix)
    expect(getByText('Beau')).toBeTruthy();
    expect(getByText('Cocker spaniel × poodle · 8 years')).toBeTruthy();
    // §5 Remy
    expect(getByText('Remy')).toBeTruthy();
    expect(getByText('Bordoodle × poodle · 6 years')).toBeTruthy();
    // Pull-quote (now lives inside Origins of Bemy)
    expect(getByText('Bemy = Beau + Remy')).toBeTruthy();
    // §6 Why I built it
    expect(getByText('Why I built it')).toBeTruthy();
    // §7 What Bemy is, and isn't
    expect(getByText("What Bemy is, and isn't")).toBeTruthy();
    // §8 A small ask
    expect(getByText('A small ask')).toBeTruthy();
    // §9 Thanks for being here
    expect(getByText('Thanks for being here')).toBeTruthy();
    // Sign-off (em-dash scrubbed, now just "Jack")
    expect(getByText('Jack')).toBeTruthy();
  });

  it('Origins of Bemy section explains the namesake', () => {
    const { getByText } = render(<AboutScreen />);
    // Key copy beat from the new section.
    expect(
      getByText(/Bemy is just Beau and Remy.+names smooshed together/),
    ).toBeTruthy();
  });

  it('renders the Beau card with the founder-supplied photo', () => {
    const { getByTestId } = render(<AboutScreen />);
    expect(getByTestId('meet-card-beau')).toBeTruthy();
    expect(getByTestId('meet-card-photo-beau')).toBeTruthy();
  });

  it('renders the Remy card with the founder-supplied photo', () => {
    const { getByTestId } = render(<AboutScreen />);
    expect(getByTestId('meet-card-remy')).toBeTruthy();
    expect(getByTestId('meet-card-photo-remy')).toBeTruthy();
  });

  it('renders the pull-quote primitive inside the Origins section', () => {
    const { getByTestId, getByText } = render(<AboutScreen />);
    expect(getByTestId('pull-quote')).toBeTruthy();
    expect(getByText('Bemy = Beau + Remy')).toBeTruthy();
  });

  it('does not render the cheesy footer line', () => {
    const { queryByText, queryByTestId } = render(<AboutScreen />);
    expect(queryByText(/Made with care in Australia/)).toBeNull();
    expect(queryByTestId('about-footer')).toBeNull();
  });

  it('does not contain any em-dashes in rendered text', () => {
    const { queryAllByText } = render(<AboutScreen />);
    // Paranoid hyphen / em-dash scrub check. Founder feedback May 3 2026
    // explicitly removed all em-dashes from the page copy.
    expect(queryAllByText(/—/)).toHaveLength(0);
  });

  it('Send Feedback CTA fires a light haptic and routes to /(main)/feedback', async () => {
    const { getByTestId } = render(<AboutScreen />);
    // The Button primitive exposes testID="button"; CTA is the only Button on
    // the page. Disambiguates from the in-body "Send Feedback" mention in
    // the "A small ask" section.
    fireEvent.press(getByTestId('button'));

    await waitFor(() => {
      expect(mockImpactAsync).toHaveBeenCalledTimes(1);
      expect(mockImpactAsync).toHaveBeenCalledWith('light');
      expect(mockPush).toHaveBeenCalledWith('/(main)/feedback');
    });
  });

  it('back button calls router.back', () => {
    const { getByTestId } = render(<AboutScreen />);
    fireEvent.press(getByTestId('about-back'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  // Defensive PII regression guards. The page intentionally introduces "Jack"
  // (first name) and "Australia"; everything else listed here is a hard PII
  // boundary the PM and the design spec lock down.
  it('does not surface the founder surname or any extended PII', () => {
    const { queryAllByText } = render(<AboutScreen />);
    expect(queryAllByText(/Dinh/i)).toHaveLength(0);
    expect(queryAllByText(/jacksangdinh/i)).toHaveLength(0);
    expect(queryAllByText(/@gmail\.com/i)).toHaveLength(0);
    expect(queryAllByText(/Beebles/i)).toHaveLength(0);
  });
});
