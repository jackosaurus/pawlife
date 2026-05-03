import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import MenuScreen from '../../app/(main)/menu';
import { userService } from '@/services/userService';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockSignOut = jest.fn();

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

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({
      session: {
        user: { id: 'user-1', email: 'jack@example.com' },
      },
      signOut: mockSignOut,
    }),
}));

jest.mock('@/services/userService', () => ({
  userService: {
    getProfile: jest.fn(),
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('@/constants/colors', () => ({
  Colors: {
    textPrimary: '#2D2A26',
    textSecondary: '#7A756E',
    primary: '#4A2157',
    statusOverdue: '#E8735A',
    border: '#EDE8DF',
    background: '#FFF8E7',
    inputFill: '#F5F3F0',
  },
}));

describe('MenuScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (userService.getProfile as jest.Mock).mockResolvedValue({
      id: 'user-1',
      display_name: 'Jack',
    });
  });

  it('renders display name and email in header', async () => {
    const { findByTestId, getByTestId } = render(<MenuScreen />);
    await findByTestId('menu-display-name');
    await waitFor(() => {
      expect(getByTestId('menu-display-name').props.children).toBe('Jack');
    });
    expect(getByTestId('menu-email').props.children).toBe('jack@example.com');
  });

  it('falls back to email when display name is empty', async () => {
    (userService.getProfile as jest.Mock).mockResolvedValue({
      id: 'user-1',
      display_name: null,
    });
    const { getByTestId } = render(<MenuScreen />);
    await waitFor(() => {
      expect(getByTestId('menu-display-name').props.children).toBe(
        'jack@example.com',
      );
    });
  });

  it('renders all menu rows', () => {
    const { getByTestId, getByText } = render(<MenuScreen />);
    expect(getByTestId('menu-row-settings')).toBeTruthy();
    expect(getByTestId('menu-row-pet-family')).toBeTruthy();
    expect(getByTestId('menu-row-about')).toBeTruthy();
    expect(getByTestId('menu-row-feedback')).toBeTruthy();
    expect(getByTestId('menu-row-signout')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Pet Family')).toBeTruthy();
    expect(getByText('About')).toBeTruthy();
    expect(getByText('Send Feedback')).toBeTruthy();
    expect(getByText('Sign Out')).toBeTruthy();
  });

  it('places the About row directly above Send Feedback (and below Pet Family)', () => {
    const { toJSON } = render(<MenuScreen />);

    // Walk the rendered JSON tree and collect the order of menu-row testIDs.
    // Asserting About sits between Pet Family and Send Feedback in render
    // order is the regression guard the design spec calls for.
    const collected: string[] = [];
    const visit = (node: unknown) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }
      const n = node as {
        props?: { testID?: string };
        children?: unknown;
      };
      const id = n.props?.testID;
      if (typeof id === 'string' && id.startsWith('menu-row-')) {
        collected.push(id);
      }
      if (n.children) visit(n.children);
    };
    visit(toJSON());

    const petFamilyIdx = collected.indexOf('menu-row-pet-family');
    const aboutIdx = collected.indexOf('menu-row-about');
    const feedbackIdx = collected.indexOf('menu-row-feedback');

    expect(petFamilyIdx).toBeGreaterThanOrEqual(0);
    expect(aboutIdx).toBeGreaterThan(petFamilyIdx);
    expect(feedbackIdx).toBeGreaterThan(aboutIdx);
  });

  it('navigates to about when About row pressed', () => {
    const { getByTestId } = render(<MenuScreen />);
    fireEvent.press(getByTestId('menu-row-about'));
    expect(mockPush).toHaveBeenCalledWith('/(main)/about');
  });

  it('navigates to settings when Settings row pressed', () => {
    const { getByTestId } = render(<MenuScreen />);
    fireEvent.press(getByTestId('menu-row-settings'));
    expect(mockPush).toHaveBeenCalledWith('/(main)/settings');
  });

  it('navigates to pet-family when Pet Family row pressed', () => {
    const { getByTestId } = render(<MenuScreen />);
    fireEvent.press(getByTestId('menu-row-pet-family'));
    expect(mockPush).toHaveBeenCalledWith('/(main)/pet-family');
  });

  it('navigates to feedback when Send Feedback row pressed', () => {
    const { getByTestId } = render(<MenuScreen />);
    fireEvent.press(getByTestId('menu-row-feedback'));
    expect(mockPush).toHaveBeenCalledWith('/(main)/feedback');
  });

  it('Sign Out row is styled destructively (red)', () => {
    const { getByText } = render(<MenuScreen />);
    const signOutText = getByText('Sign Out');
    expect(signOutText.props.style).toEqual(
      expect.objectContaining({ color: '#E8735A' }),
    );
  });

  it('opens the sign-out confirmation modal when Sign Out row pressed', () => {
    const { getByTestId, queryByTestId } = render(<MenuScreen />);
    // RN Modal renders nothing when visible=false in tests.
    expect(queryByTestId('confirm-button')).toBeNull();
    fireEvent.press(getByTestId('menu-row-signout'));
    expect(getByTestId('confirm-button')).toBeTruthy();
  });

  it('on confirmed sign out, calls router.back BEFORE signOut', async () => {
    const callOrder: string[] = [];
    mockBack.mockImplementation(() => {
      callOrder.push('back');
    });
    mockSignOut.mockImplementation(async () => {
      callOrder.push('signOut');
    });

    const { getByTestId } = render(<MenuScreen />);
    fireEvent.press(getByTestId('menu-row-signout'));
    await act(async () => {
      fireEvent.press(getByTestId('confirm-button'));
    });

    await waitFor(() => {
      expect(callOrder).toEqual(['back', 'signOut']);
    });
  });

  it('cancel sign out does not call signOut', () => {
    const { getByTestId } = render(<MenuScreen />);
    fireEvent.press(getByTestId('menu-row-signout'));
    fireEvent.press(getByTestId('cancel-button'));
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
