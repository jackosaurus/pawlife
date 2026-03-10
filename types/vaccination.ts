import { z } from 'zod';

export const addVaccinationSchema = z.object({
  vaccineName: z.string().min(1, 'Vaccine name is required'),
  dateAdministered: z.string().min(1, 'Date is required'),
  nextDueDate: z.string().nullable().optional(),
  clinicName: z.string().nullable().optional(),
});

export type AddVaccinationFormData = z.infer<typeof addVaccinationSchema>;
