import { z } from 'zod';

export const addWeightEntrySchema = z.object({
  weight: z.string().min(1, 'Weight is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Weight must be a positive number',
  ),
  date: z.string().min(1, 'Date is required'),
  note: z.string().nullable().optional(),
});

export type AddWeightEntryFormData = z.infer<typeof addWeightEntrySchema>;
