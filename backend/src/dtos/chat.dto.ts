import { z } from 'zod';

export const chatStreamSchema = z.object({
  prompt: z
    .string({ message: 'Yêu cầu (prompt) phải là chuỗi văn bản' })
    .min(1, 'Yêu cầu (prompt) không được để trống')
    .max(4000, 'Yêu cầu (prompt) không được vượt quá 4000 ký tự'),
  sessionId: z.string().optional(),
  projectId: z.string().optional(),
});

export type ChatStreamDto = z.infer<typeof chatStreamSchema>;
