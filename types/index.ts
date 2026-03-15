import { Database } from './database';

// Convenience type aliases from the generated database types
export type Tables = Database['public']['Tables'];

export type User = Tables['users']['Row'];

export type Family = Tables['families']['Row'];
export type FamilyInsert = Tables['families']['Insert'];
export type FamilyUpdate = Tables['families']['Update'];

export type FamilyMember = Tables['family_members']['Row'] & {
  email?: string;
  display_name?: string;
};
export type FamilyMemberInsert = Tables['family_members']['Insert'];

export type FamilyInvite = Tables['family_invites']['Row'];
export type FamilyInviteInsert = Tables['family_invites']['Insert'];

export interface InvitePreview {
  family_name: string;
  expires_at: string;
}

export type Pet = Tables['pets']['Row'];
export type PetInsert = Tables['pets']['Insert'];
export type PetUpdate = Tables['pets']['Update'];

export type VetVisit = Tables['vet_visits']['Row'];
export type VetVisitInsert = Tables['vet_visits']['Insert'];
export type VetVisitUpdate = Tables['vet_visits']['Update'];

export type VetVisitAttachment = Tables['vet_visit_attachments']['Row'];
export type VetVisitAttachmentInsert = Tables['vet_visit_attachments']['Insert'];

export type Vaccination = Tables['vaccinations']['Row'];
export type VaccinationInsert = Tables['vaccinations']['Insert'];
export type VaccinationUpdate = Tables['vaccinations']['Update'];

export type Medication = Tables['medications']['Row'];
export type MedicationInsert = Tables['medications']['Insert'];
export type MedicationUpdate = Tables['medications']['Update'];

export type MedicationDose = Tables['medication_doses']['Row'];
export type MedicationDoseInsert = Tables['medication_doses']['Insert'];

export type WeightEntry = Tables['weight_entries']['Row'];
export type WeightEntryInsert = Tables['weight_entries']['Insert'];
export type WeightEntryUpdate = Tables['weight_entries']['Update'];

export type FoodEntry = Tables['food_entries']['Row'];
export type FoodEntryInsert = Tables['food_entries']['Insert'];
export type FoodEntryUpdate = Tables['food_entries']['Update'];

// ── Action Items (Dashboard "Needs Attention") ──────────────────

export type ActionItemType = 'medication' | 'vaccination';
export type ActionItemUrgency = 'overdue' | 'due_today' | 'upcoming';

export interface ActionItem {
  id: string;
  type: ActionItemType;
  urgency: ActionItemUrgency;
  petId: string;
  petName: string;
  title: string;
  subtitle: string;
  recordId: string;
  medicationId?: string;
}
