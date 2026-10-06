import { z } from 'zod';

export const createSessionSchema = z.object({
  title: z.string().min(1, 'Tên phiên không được để trống').max(100, 'Tên phiên quá dài').optional(),
  initialPrompt: z.string().optional(),
});

export const updateSessionSchema = z.object({
  title: z.string().min(1, 'Tên phiên không được để trống').max(100, 'Tên phiên quá dài'),
});

export type CreateSessionDto = z.infer<typeof createSessionSchema>;
export type UpdateSessionDto = z.infer<typeof updateSessionSchema>;
