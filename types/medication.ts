import { z } from 'zod';
import { MEDICATION_FREQUENCIES } from '@/constants/frequencies';

export const addMedicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().nullable().optional(),
  frequency: z.string({
    required_error: 'Please select a frequency',
    invalid_type_error: 'Please select a frequency',
  }).refine(
    (val) => (MEDICATION_FREQUENCIES as readonly string[]).includes(val),
    'Please select a valid frequency',
  ),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type AddMedicationFormData = z.infer<typeof addMedicationSchema>;
