import { Database } from './database';

// Convenience type aliases from the generated database types
export type Tables = Database['public']['Tables'];

export type User = Tables['users']['Row'];
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
