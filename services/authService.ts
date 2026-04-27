import { supabase } from './supabase';
import { observabilityService } from './observabilityService';
import { analyticsService } from './analyticsService';

export const authService = {
  async signUp(email: string, password: string) {
    // Funnel start — fires before the network call so we can measure the
    // signup-attempt → signup-success conversion.
    analyticsService.track('auth_signup_started', {});
    let data: Awaited<ReturnType<typeof supabase.auth.signUp>>['data'];
    try {
      const result = await supabase.auth.signUp({ email, password });
      if (result.error) throw result.error;
      data = result.data;
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown';
      analyticsService.track('auth_signup_failed', { reason });
      throw err;
    }
    if (!data.session) {
      // Email-confirmation flow: no session yet. We cannot identify here
      // (no user yet), but it's also not a "failure" — surface as a
      // distinct funnel exit so the dashboard can distinguish.
      analyticsService.track('auth_signup_failed', {
        reason: 'email_confirmation_pending',
      });
      throw new Error(
        'Please check your email to confirm your account before signing in.',
      );
    }
    if (data.user?.id) {
      observabilityService.identify(data.user.id);
    }
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.user?.id) {
      observabilityService.identify(data.user.id);
    }
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    observabilityService.reset();
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  async changePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },
};
