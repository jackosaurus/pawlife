import { z } from 'zod';
import { Database } from './database';

// ── DB row aliases ─────────────────────────────────────────────
export type PetAllergy = Database['public']['Tables']['pet_allergies']['Row'];
export type PetAllergyInsert =
  Database['public']['Tables']['pet_allergies']['Insert'];
export type PetAllergyUpdate =
  Database['public']['Tables']['pet_allergies']['Update'];

// ── Form schema ────────────────────────────────────────────────
// 50-char cap mirrors the spec; DB itself has no length limit.
// `.trim()` strips surrounding whitespace before validating min length so
// a string of only spaces is rejected as empty.
export const allergySchema = z.object({
  allergen: z
    .string()
    .trim()
    .min(1, 'Allergen is required')
    .max(50, 'Allergen is too long'),
});

export type AllergyFormData = z.infer<typeof allergySchema>;
