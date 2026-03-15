import { feedbackService } from './feedbackService';
import { supabase } from './supabase';

jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockFrom = supabase.from as jest.Mock;

describe('feedbackService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submit', () => {
    it('inserts feedback into the feedback table', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      mockFrom.mockReturnValue({ insert: mockInsert });

      await feedbackService.submit({
        user_id: 'user-1',
        user_email: 'test@example.com',
        category: 'bug',
        description: 'Something broke',
        app_version: '1.0.0',
        device_model: 'iPhone 15',
        os_name: 'iOS',
        os_version: '18.0',
        screen_name: 'settings',
      });

      expect(mockFrom).toHaveBeenCalledWith('feedback');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-1',
        user_email: 'test@example.com',
        category: 'bug',
        description: 'Something broke',
        app_version: '1.0.0',
        device_model: 'iPhone 15',
        os_name: 'iOS',
        os_version: '18.0',
        screen_name: 'settings',
      });
    });

    it('throws on error', async () => {
      const mockInsert = jest
        .fn()
        .mockResolvedValue({ error: new Error('DB error') });
      mockFrom.mockReturnValue({ insert: mockInsert });

      await expect(
        feedbackService.submit({
          description: 'test',
        }),
      ).rejects.toThrow('DB error');
    });
  });
});
