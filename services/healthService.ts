import { supabase } from './supabase';
import {
  Vaccination,
  VaccinationInsert,
  VaccinationUpdate,
} from '@/types';

export const healthService = {
  async getVaccinations(petId: string): Promise<Vaccination[]> {
    const { data, error } = await supabase
      .from('vaccinations')
      .select('*')
      .eq('pet_id', petId)
      .order('date_administered', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getVaccinationById(id: string): Promise<Vaccination> {
    const { data, error } = await supabase
      .from('vaccinations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createVaccination(vaccination: VaccinationInsert): Promise<Vaccination> {
    const { data, error } = await supabase
      .from('vaccinations')
      .insert(vaccination)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateVaccination(
    id: string,
    updates: VaccinationUpdate,
  ): Promise<Vaccination> {
    const { data, error } = await supabase
      .from('vaccinations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteVaccination(id: string): Promise<void> {
    const { error } = await supabase
      .from('vaccinations')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
