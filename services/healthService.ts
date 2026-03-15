import { supabase } from './supabase';
import {
  Vaccination,
  VaccinationInsert,
  VaccinationUpdate,
  VaccinationDose,
  VaccinationDoseInsert,
  VetVisit,
  VetVisitInsert,
  VetVisitUpdate,
  VetVisitAttachment,
  VetVisitAttachmentInsert,
  Medication,
  MedicationInsert,
  MedicationUpdate,
  MedicationDose,
  MedicationDoseInsert,
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
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('vaccinations')
      .insert({
        ...vaccination,
        created_by: user?.id ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateVaccination(
    id: string,
    updates: VaccinationUpdate,
  ): Promise<Vaccination> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('vaccinations')
      .update({
        ...updates,
        modified_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      })
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

  // ── Vaccination Doses ───────────────────────────────────────────

  async logVaccinationDose(
    dose: VaccinationDoseInsert,
    intervalMonths: number,
  ): Promise<VaccinationDose> {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Insert the dose
    const { data, error } = await supabase
      .from('vaccination_doses')
      .insert({
        ...dose,
        created_by: user?.id ?? null,
      })
      .select()
      .single();
    if (error) throw error;

    // 2. Calculate next due date
    const doseDate = new Date(dose.date_administered);
    doseDate.setMonth(doseDate.getMonth() + intervalMonths);
    const nextDueDate = doseDate.toISOString().split('T')[0];

    // 3. Update the parent vaccination record
    const { error: updateError } = await supabase
      .from('vaccinations')
      .update({
        date_administered: dose.date_administered,
        next_due_date: nextDueDate,
        ...(dose.clinic_name ? { clinic_name: dose.clinic_name } : {}),
        modified_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dose.vaccination_id);
    if (updateError) throw updateError;

    return data;
  },

  async getVaccinationDoses(vaccinationId: string): Promise<VaccinationDose[]> {
    const { data, error } = await supabase
      .from('vaccination_doses')
      .select('*')
      .eq('vaccination_id', vaccinationId)
      .order('date_administered', { ascending: false });
    if (error) throw error;
    return data;
  },

  async deleteVaccinationDose(id: string): Promise<void> {
    const { error } = await supabase
      .from('vaccination_doses')
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
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('vet_visits')
      .insert({
        ...vetVisit,
        created_by: user?.id ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateVetVisit(
    id: string,
    updates: VetVisitUpdate,
  ): Promise<VetVisit> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('vet_visits')
      .update({
        ...updates,
        modified_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      })
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
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('medications')
      .insert({
        ...medication,
        created_by: user?.id ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateMedication(
    id: string,
    updates: MedicationUpdate,
  ): Promise<Medication> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('medications')
      .update({
        ...updates,
        modified_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      })
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

  // ── Medication Doses ─────────────────────────────────────────

  async getMedicationDoses(medicationId: string): Promise<MedicationDose[]> {
    const { data, error } = await supabase
      .from('medication_doses')
      .select('*')
      .eq('medication_id', medicationId)
      .order('given_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async logMedicationDose(dose: MedicationDoseInsert): Promise<MedicationDose> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('medication_doses')
      .insert({
        ...dose,
        created_by: user?.id ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteMedicationDose(id: string): Promise<void> {
    const { error } = await supabase
      .from('medication_doses')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getTodayDoseCounts(
    medicationIds: string[],
  ): Promise<Record<string, number>> {
    if (medicationIds.length === 0) return {};
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from('medication_doses')
      .select('medication_id')
      .in('medication_id', medicationIds)
      .gte('given_at', startOfDay.toISOString());
    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const row of data) {
      counts[row.medication_id] = (counts[row.medication_id] ?? 0) + 1;
    }
    return counts;
  },

  async getLatestDoseForMedications(
    medicationIds: string[],
  ): Promise<Record<string, string>> {
    if (medicationIds.length === 0) return {};
    const { data, error } = await supabase
      .from('medication_doses')
      .select('medication_id, given_at')
      .in('medication_id', medicationIds)
      .order('given_at', { ascending: false });
    if (error) throw error;

    // Client-side dedup: keep only the latest dose per medication
    const latest: Record<string, string> = {};
    for (const row of data) {
      if (!latest[row.medication_id]) {
        latest[row.medication_id] = row.given_at;
      }
    }
    return latest;
  },

  // ── Cross-Pet Queries (Dashboard Action Items) ──────────────

  async getActiveMedicationsForPets(petIds: string[]): Promise<Medication[]> {
    if (petIds.length === 0) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .in('pet_id', petIds)
      .eq('is_completed', false)
      .or(`end_date.is.null,end_date.gte.${todayStr}`)
      .neq('frequency', 'As needed');
    if (error) throw error;
    return data;
  },

  async getActionableVaccinations(
    petIds: string[],
    advanceDays: number,
  ): Promise<Vaccination[]> {
    if (petIds.length === 0) return [];
    const futureDate = new Date();
    futureDate.setHours(0, 0, 0, 0);
    futureDate.setDate(futureDate.getDate() + advanceDays);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('vaccinations')
      .select('*')
      .in('pet_id', petIds)
      .not('next_due_date', 'is', null)
      .lte('next_due_date', futureDateStr);
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
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('weight_entries')
      .insert({
        ...entry,
        created_by: user?.id ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateWeightEntry(
    id: string,
    updates: WeightEntryUpdate,
  ): Promise<WeightEntry> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('weight_entries')
      .update({
        ...updates,
        modified_by: user?.id ?? null,
      })
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
