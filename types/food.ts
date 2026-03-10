import { z } from 'zod';

export const addFoodSchema = z.object({
  brand: z.string().min(1, 'Brand is required'),
  productName: z.string().nullable().optional(),
  foodType: z.enum(['dry', 'wet', 'raw', 'mixed']).nullable().optional(),
  amountPerMeal: z.string().nullable().optional(),
  mealsPerDay: z.number().int().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const changeFoodSchema = addFoodSchema.extend({
  reasonForChange: z.string().nullable().optional(),
});

export type AddFoodFormData = z.infer<typeof addFoodSchema>;
export type ChangeFoodFormData = z.infer<typeof changeFoodSchema>;
