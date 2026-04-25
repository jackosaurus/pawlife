import { supabase } from './supabase';
import { PetAllergy } from '@/types';

export const allergyService = {
  async listByPet(petId: string): Promise<PetAllergy[]> {
    const { data, error } = await supabase
      .from('pet_allergies')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(input: { pet_id: string; allergen: string }): Promise<PetAllergy> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('pet_allergies')
      .insert({
        pet_id: input.pet_id,
        allergen: input.allergen,
        created_by: user?.id ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: { allergen: string }): Promise<PetAllergy> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('pet_allergies')
      .update({
        allergen: updates.allergen,
        modified_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<PetAllergy> {
    const { data, error } = await supabase
      .from('pet_allergies')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('pet_allergies')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
