import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import PetFamilyScreen from '../../app/(main)/pet-family';
import { petService } from '@/services/petService';
import { familyService } from '@/services/familyService';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockLoadFamily = jest.fn();

let mockFamilyState: {
  family: { id: string; name: string } | null;
  members: Array<{
    id: string;
    user_id: string;
    role: 'admin' | 'member';
    display_name: string | null;
    joined_at: string | null;
  }>;
  myRole: 'admin' | 'member' | null;
  loading: boolean;
};

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
    }),
}));

jest.mock('@/stores/familyStore', () => ({
  useFamilyStore: (selector: (s: unknown) => unknown) =>
    selector({
      ...mockFamilyState,
      loadFamily: mockLoadFamily,
    }),
}));

jest.mock('@/services/petService', () => ({
  petService: {
    getAll: jest.fn(),
    getArchived: jest.fn(),
    restore: jest.fn(),
  },
}));

jest.mock('@/services/userService', () => ({
  userService: {
    getProfile: jest.fn().mockResolvedValue({ display_name: 'Jack' }),
  },
}));

jest.mock('@/services/familyService', () => ({
  familyService: {
    getActiveInvite: jest.fn(),
    updateFamilyName: jest.fn(),
    removeMember: jest.fn(),
    leaveFamily: jest.fn(),
    revokeInvite: jest.fn(),
  },
  formatInviteCode: (c: string) => `${c.slice(0, 4)}-${c.slice(4)}`,
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

jest.mock('@/utils/dates', () => ({
  formatDistanceToNow: () => 'just now',
}));

jest.mock('@/components/ui/Avatar', () => ({
  Avatar: 'Avatar',
}));

describe('PetFamilyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFamilyState = {
      family: { id: 'fam-1', name: 'Smith Family' },
      members: [
        {
          id: 'mem-1',
          user_id: 'user-1',
          role: 'admin',
          display_name: 'Jack',
          joined_at: '2025-01-01T00:00:00Z',
        },
      ],
      myRole: 'admin',
      loading: false,
    };
    (petService.getAll as jest.Mock).mockResolvedValue([
      { id: 'pet-1', name: 'Buddy', breed: 'Lab', pet_type: 'dog' },
    ]);
    (petService.getArchived as jest.Mock).mockResolvedValue([
      {
        id: 'pet-archived-1',
        name: 'Old Pet',
        breed: 'Mixed',
        pet_type: 'dog',
      },
    ]);
    (familyService.getActiveInvite as jest.Mock).mockResolvedValue(null);
  });

  it('renders Family and Pets sections with title', async () => {
    const { getByText, findByText } = render(<PetFamilyScreen />);
    expect(getByText('Pet Family')).toBeTruthy();
    expect(getByText('Family')).toBeTruthy();
    expect(getByText('Pets')).toBeTruthy();
    await findByText('Buddy');
    expect(getByText('Smith Family')).toBeTruthy();
  });

  it('renders Archived Pets section when archived pets exist', async () => {
    const { findByText } = render(<PetFamilyScreen />);
    await findByText('Archived Pets');
    await findByText('Old Pet');
  });

  it('admin solo: shows Invite Member + Join a Family buttons', async () => {
    const { getByText, findByText } = render(<PetFamilyScreen />);
    await findByText('Buddy');
    expect(getByText('Invite Member')).toBeTruthy();
    expect(getByText('Join a Family')).toBeTruthy();
  });

  it('admin solo: Invite Member navigates to pet-family/invite-member', async () => {
    const { findByText } = render(<PetFamilyScreen />);
    const btn = await findByText('Invite Member');
    fireEvent.press(btn);
    expect(mockPush).toHaveBeenCalledWith('/(main)/pet-family/invite-member');
  });

  it('admin solo: Join a Family navigates to pet-family/join-family', async () => {
    const { findByText } = render(<PetFamilyScreen />);
    const btn = await findByText('Join a Family');
    fireEvent.press(btn);
    expect(mockPush).toHaveBeenCalledWith('/(main)/pet-family/join-family');
  });

  it('member: shows Leave Family button and triggers leaveFamily', async () => {
    mockFamilyState = {
      family: { id: 'fam-1', name: 'Smith Family' },
      members: [
        {
          id: 'mem-1',
          user_id: 'user-2',
          role: 'admin',
          display_name: 'Owner',
          joined_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'mem-2',
          user_id: 'user-1',
          role: 'member',
          display_name: 'Jack',
          joined_at: '2025-02-01T00:00:00Z',
        },
      ],
      myRole: 'member',
      loading: false,
    };

    (familyService.leaveFamily as jest.Mock).mockResolvedValue(undefined);

    const { findByText, getByTestId } = render(<PetFamilyScreen />);
    const leaveBtn = await findByText('Leave Family');
    fireEvent.press(leaveBtn);

    // Confirmation modal opens — confirm button is the destructive ghost text
    await act(async () => {
      fireEvent.press(getByTestId('confirm-button'));
    });
    await waitFor(() => {
      expect(familyService.leaveFamily).toHaveBeenCalled();
    });
  });

  it('admin: remove member triggers familyService.removeMember', async () => {
    mockFamilyState = {
      family: { id: 'fam-1', name: 'Smith Family' },
      members: [
        {
          id: 'mem-1',
          user_id: 'user-1',
          role: 'admin',
          display_name: 'Jack',
          joined_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'mem-2',
          user_id: 'user-2',
          role: 'member',
          display_name: 'Alice',
          joined_at: '2025-02-01T00:00:00Z',
        },
      ],
      myRole: 'admin',
      loading: false,
    };

    (familyService.removeMember as jest.Mock).mockResolvedValue(undefined);

    const { findByTestId, getByTestId } = render(<PetFamilyScreen />);
    const removeBtn = await findByTestId('remove-member-mem-2');
    fireEvent.press(removeBtn);

    await act(async () => {
      fireEvent.press(getByTestId('confirm-button'));
    });
    await waitFor(() => {
      expect(familyService.removeMember).toHaveBeenCalledWith('mem-2');
    });
  });

  it('restore archived pet triggers petService.restore immediately (no modal)', async () => {
    (petService.restore as jest.Mock).mockResolvedValue(undefined);

    const { findByTestId } = render(<PetFamilyScreen />);
    const restoreBtn = await findByTestId('restore-pet-archived-1');
    await act(async () => {
      fireEvent.press(restoreBtn);
    });
    await waitFor(() => {
      expect(petService.restore).toHaveBeenCalledWith('pet-archived-1');
    });
  });

  it('Add a pet CTA navigates to pets/add', async () => {
    const { findByTestId } = render(<PetFamilyScreen />);
    const btn = await findByTestId('add-pet-button');
    fireEvent.press(btn);
    expect(mockPush).toHaveBeenCalledWith('/(main)/pets/add');
  });

  it('back arrow navigates back', () => {
    const { getByTestId } = render(<PetFamilyScreen />);
    fireEvent.press(getByTestId('back-button'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('admin can edit family name', async () => {
    (familyService.updateFamilyName as jest.Mock).mockResolvedValue(undefined);
    const { findByTestId, getByText } = render(<PetFamilyScreen />);
    const editBtn = await findByTestId('edit-family-name-button');
    fireEvent.press(editBtn);
    await waitFor(() => {
      expect(getByText('Save')).toBeTruthy();
    });
  });
});
