import { supabase } from './supabase';
import { PushTokenEntry, NotificationPreferences } from '@/types';
import { Json } from '@/types/database';

export const notificationService = {
  async registerPushToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android',
  ): Promise<void> {
    // Fetch current tokens
    const { data, error: fetchError } = await supabase
      .from('users')
      .select('push_tokens')
      .eq('id', userId)
      .single();
    if (fetchError) throw fetchError;

    const existing = (data.push_tokens ?? []) as PushTokenEntry[];
    const now = new Date().toISOString();

    // Upsert: replace if token exists, otherwise append
    const filtered = existing.filter((t) => t.token !== token);
    const updated: PushTokenEntry[] = [
      ...filtered,
      { token, platform, updated_at: now },
    ];

    const { error } = await supabase
      .from('users')
      .update({ push_tokens: updated as unknown as Json })
      .eq('id', userId);
    if (error) throw error;
  },

  async unregisterPushToken(userId: string, token: string): Promise<void> {
    const { data, error: fetchError } = await supabase
      .from('users')
      .select('push_tokens')
      .eq('id', userId)
      .single();
    if (fetchError) throw fetchError;

    const existing = (data.push_tokens ?? []) as PushTokenEntry[];
    const updated = existing.filter((t) => t.token !== token);

    const { error } = await supabase
      .from('users')
      .update({ push_tokens: updated as unknown as Json })
      .eq('id', userId);
    if (error) throw error;
  },

  async getNotificationPreferences(
    userId: string,
  ): Promise<NotificationPreferences> {
    const { data, error } = await supabase
      .from('users')
      .select(
        'reminders_enabled, medication_reminder_time, vaccination_advance_days',
      )
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data as NotificationPreferences;
  },
};
