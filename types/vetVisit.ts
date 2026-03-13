import { z } from 'zod';

export const addVetVisitSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  clinicName: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type AddVetVisitFormData = z.infer<typeof addVetVisitSchema>;
