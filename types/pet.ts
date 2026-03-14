import { z } from 'zod';

export const addPetSchema = z.object({
  petType: z.enum(['dog', 'cat']),
  name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
  breed: z.string().nullable().optional(),
  sex: z.enum(['male', 'female', 'unknown']).nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  approximateAgeMonths: z.number().int().min(0).nullable().optional(),
  microchipNumber: z.string().nullable().optional(),
});

export type AddPetFormData = z.infer<typeof addPetSchema>;
