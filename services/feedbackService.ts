import { supabase } from './supabase';
import { FeedbackInsert } from '@/types';

export const feedbackService = {
  async submit(feedback: FeedbackInsert): Promise<void> {
    const { error } = await supabase.from('feedback').insert(feedback);
    if (error) throw error;
  },
};
