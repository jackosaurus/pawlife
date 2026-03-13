import { supabase } from './supabase';
import {
  Vaccination,
  VaccinationInsert,
  VaccinationUpdate,
  VetVisit,
  VetVisitInsert,
  VetVisitUpdate,
  VetVisitAttachment,
  VetVisitAttachmentInsert,
  Medication,
  MedicationInsert,
  MedicationUpdate,
  WeightEntry,
  WeightEntryInsert,
  WeightEntryUpdate,
} from '@/types';

export const healthService = {
  // ── Vaccinations ──────────────────────────────────────────────

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

  // ── Vet Visits ────────────────────────────────────────────────

  async getVetVisits(petId: string): Promise<VetVisit[]> {
    const { data, error } = await supabase
      .from('vet_visits')
      .select('*')
      .eq('pet_id', petId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getVetVisitById(id: string): Promise<VetVisit> {
    const { data, error } = await supabase
      .from('vet_visits')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createVetVisit(vetVisit: VetVisitInsert): Promise<VetVisit> {
    const { data, error } = await supabase
      .from('vet_visits')
      .insert(vetVisit)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateVetVisit(
    id: string,
    updates: VetVisitUpdate,
  ): Promise<VetVisit> {
    const { data, error } = await supabase
      .from('vet_visits')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getRecentClinics(
    petId: string,
    limit = 3,
  ): Promise<{ clinicName: string; lastVisitDate: string }[]> {
    const { data, error } = await supabase
      .from('vet_visits')
      .select('clinic_name, date')
      .eq('pet_id', petId)
      .not('clinic_name', 'is', null)
      .order('date', { ascending: false });
    if (error) throw error;

    // Deduplicate by clinic name, keeping the most recent date
    const seen = new Map<string, string>();
    for (const row of data) {
      if (row.clinic_name && !seen.has(row.clinic_name)) {
        seen.set(row.clinic_name, row.date);
      }
    }

    return Array.from(seen.entries())
      .slice(0, limit)
      .map(([clinicName, lastVisitDate]) => ({ clinicName, lastVisitDate }));
  },

  async deleteVetVisit(id: string): Promise<void> {
    const { error } = await supabase
      .from('vet_visits')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ── Vet Visit Attachments ────────────────────────────────────

  async getAttachments(vetVisitId: string): Promise<VetVisitAttachment[]> {
    const { data, error } = await supabase
      .from('vet_visit_attachments')
      .select('*')
      .eq('vet_visit_id', vetVisitId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createAttachment(
    attachment: VetVisitAttachmentInsert,
  ): Promise<VetVisitAttachment> {
    const { data, error } = await supabase
      .from('vet_visit_attachments')
      .insert(attachment)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteAttachment(id: string): Promise<void> {
    const { error } = await supabase
      .from('vet_visit_attachments')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async uploadAttachment(
    userId: string,
    petId: string,
    fileUri: string,
    fileName: string,
  ): Promise<string> {
    const path = `${userId}/${petId}/${Date.now()}_${fileName}`;
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const { error } = await supabase.storage
      .from('vet-attachments')
      .upload(path, blob, { contentType: blob.type });
    if (error) throw error;
    return path;
  },

  async deleteAttachmentFile(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from('vet-attachments')
      .remove([path]);
    if (error) throw error;
  },

  async getAttachmentUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('vet-attachments')
      .createSignedUrl(path, 3600);
    if (error) throw error;
    return data.signedUrl;
  },

  // ── Medications ───────────────────────────────────────────────

  async getMedications(petId: string): Promise<Medication[]> {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('pet_id', petId)
      .order('start_date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getMedicationById(id: string): Promise<Medication> {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createMedication(medication: MedicationInsert): Promise<Medication> {
    const { data, error } = await supabase
      .from('medications')
      .insert(medication)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateMedication(
    id: string,
    updates: MedicationUpdate,
  ): Promise<Medication> {
    const { data, error } = await supabase
      .from('medications')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteMedication(id: string): Promise<void> {
    const { error } = await supabase
      .from('medications')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async markMedicationCompleted(id: string): Promise<Medication> {
    const { data, error } = await supabase
      .from('medications')
      .update({
        is_completed: true,
        end_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ── Weight Entries ────────────────────────────────────────────

  async getWeightEntries(petId: string): Promise<WeightEntry[]> {
    const { data, error } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('pet_id', petId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getWeightEntryById(id: string): Promise<WeightEntry> {
    const { data, error } = await supabase
      .from('weight_entries')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createWeightEntry(entry: WeightEntryInsert): Promise<WeightEntry> {
    const { data, error } = await supabase
      .from('weight_entries')
      .insert(entry)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateWeightEntry(
    id: string,
    updates: WeightEntryUpdate,
  ): Promise<WeightEntry> {
    const { data, error } = await supabase
      .from('weight_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteWeightEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('weight_entries')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
