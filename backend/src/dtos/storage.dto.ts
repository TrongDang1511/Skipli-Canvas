import { z } from 'zod';

export const storageQuerySchema = z.object({
  sessionId: z.string().optional(),
});

export type StorageQueryDto = z.infer<typeof storageQuerySchema>;
