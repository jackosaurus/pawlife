import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { authService } from '@/services/authService';
import { useFamilyStore } from '@/stores/familyStore';

interface AuthState {
  session: Session | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  setSession: (session: Session | null) => void;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  initialized: false,
  loading: false,
  error: null,

  initialize: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ session, initialized: true });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
    });
  },

  setSession: (session) => set({ session }),

  signUp: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await authService.signUp(email, password);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await authService.signIn(email, password);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      await authService.signOut();
      useFamilyStore.getState().clearFamily();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
