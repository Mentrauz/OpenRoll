import { z } from 'zod';

export const loginSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export type LoginInput = z.infer<typeof loginSchema>;





















