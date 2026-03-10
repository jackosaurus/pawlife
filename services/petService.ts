import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from './supabase';
import { Pet, PetInsert, PetUpdate } from '@/types';

export const petService = {
  async getAll(): Promise<Pet[]> {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('is_archived', false)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Pet> {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(pet: PetInsert): Promise<Pet> {
    const { data, error } = await supabase
      .from('pets')
      .insert(pet)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: PetUpdate): Promise<Pet> {
    const { data, error } = await supabase
      .from('pets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async archive(id: string): Promise<void> {
    const { error } = await supabase
      .from('pets')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async restore(id: string): Promise<void> {
    const { error } = await supabase
      .from('pets')
      .update({ is_archived: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async getArchived(): Promise<Pet[]> {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('is_archived', true)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async uploadProfilePhoto(
    userId: string,
    petId: string,
    imageUri: string,
  ): Promise<string> {
    const compressed = await manipulateAsync(
      imageUri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: SaveFormat.JPEG },
    );

    const path = `${userId}/${petId}/profile.jpg`;
    const response = await fetch(compressed.uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('pet-photos')
      .upload(path, blob, { contentType: 'image/jpeg', upsert: true });
    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from('pet-photos').getPublicUrl(path);
    return publicUrl;
  },
};
