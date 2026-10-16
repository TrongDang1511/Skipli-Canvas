import { z } from 'zod';

export const createSessionSchema = z.object({
  title: z.string().min(1, 'Tên phiên không được để trống').max(100, 'Tên phiên quá dài').optional(),
  initialPrompt: z.string().optional(),
});

export const updateSessionSchema = z.object({
  title: z.string().min(1, 'Tên phiên không được để trống').max(100, 'Tên phiên quá dài'),
});

export const overwriteCanvasSchema = z.object({
  cleanHtml: z.string().min(1, 'Mã HTML không được để trống'),
});

export const rollbackUserTurnSchema = z.object({
  userMessageId: z.string().min(1, 'userMessageId không được để trống'),
  promptText: z.string().optional(),
});

export const rollbackMilestoneSchema = z.object({
  milestoneMessageId: z.string().min(1, 'milestoneMessageId không được để trống'),
});

export type CreateSessionDto = z.infer<typeof createSessionSchema>;
export type UpdateSessionDto = z.infer<typeof updateSessionSchema>;
export type OverwriteCanvasDto = z.infer<typeof overwriteCanvasSchema>;
export type RollbackUserTurnDto = z.infer<typeof rollbackUserTurnSchema>;
export type RollbackMilestoneDto = z.infer<typeof rollbackMilestoneSchema>;
