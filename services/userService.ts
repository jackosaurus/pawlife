import { supabase } from './supabase';
import { User } from '@/types';

export const userService = {
  async getProfile(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async updateProfile(
    userId: string,
    updates: {
      weight_unit?: 'kg' | 'lbs';
      display_name?: string | null;
      reminders_enabled?: boolean;
      medication_reminder_time?: string;
      vaccination_advance_days?: number;
      timezone?: string;
    },
  ): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
