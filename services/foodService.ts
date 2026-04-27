import { supabase } from './supabase';
import { analyticsService } from './analyticsService';
import {
  FoodEntry,
  FoodEntryInsert,
  FoodEntryUpdate,
} from '@/types';

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export const foodService = {
  async getCurrent(petId: string): Promise<FoodEntry | null> {
    const { data, error } = await supabase
      .from('food_entries')
      .select('*')
      .eq('pet_id', petId)
      .is('end_date', null)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getHistory(petId: string): Promise<FoodEntry[]> {
    const { data, error } = await supabase
      .from('food_entries')
      .select('*')
      .eq('pet_id', petId)
      .order('start_date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<FoodEntry> {
    const { data, error } = await supabase
      .from('food_entries')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(entry: FoodEntryInsert): Promise<FoodEntry> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('food_entries')
      .insert({
        ...entry,
        created_by: userId,
      })
      .select()
      .single();
    if (error) throw error;
    analyticsService.track('food_entry_logged', { pet_id: data.pet_id });
    return data;
  },

  async update(id: string, updates: FoodEntryUpdate): Promise<FoodEntry> {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('food_entries')
      .update({
        ...updates,
        modified_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('food_entries')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async changeFood(
    petId: string,
    newFood: FoodEntryInsert,
    reasonForChange?: string,
  ): Promise<FoodEntry> {
    const today = new Date().toISOString().split('T')[0];

    // Close out current food entry
    const current = await foodService.getCurrent(petId);
    if (current) {
      await foodService.update(current.id, { end_date: today });
    }

    // Insert the new food entry
    return foodService.create({
      ...newFood,
      pet_id: petId,
      start_date: newFood.start_date ?? today,
      reason_for_change: reasonForChange ?? null,
    });
  },
};
