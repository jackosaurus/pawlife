import { z } from 'zod';

export const addMedicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().nullable().optional(),
  prescribingVet: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type AddMedicationFormData = z.infer<typeof addMedicationSchema>;
