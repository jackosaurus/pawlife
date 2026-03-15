import { z } from 'zod';

export const addVaccinationSchema = z.object({
  vaccineName: z.string().min(1, 'Vaccine name is required'),
  intervalMonths: z.number().min(1, 'Interval is required'),
  dateAdministered: z.string().min(1, 'Date is required'),
  clinicName: z.string().nullable().optional(),
});

export type AddVaccinationFormData = z.infer<typeof addVaccinationSchema>;

export const editVaccinationSchema = z.object({
  vaccineName: z.string().min(1, 'Vaccine name is required'),
  intervalMonths: z.number().min(1, 'Interval is required'),
  clinicName: z.string().nullable().optional(),
});

export type EditVaccinationFormData = z.infer<typeof editVaccinationSchema>;
