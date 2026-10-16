import { z } from 'zod';

export interface StorageFileVersionItem {
  id: string;
  fileName: string;
  version: string;
  versionId?: string;
  type?: 'ai' | 'manual';
  s3Key: string;
  sizeBytes: number;
  sizeFormatted: string;
  presignedUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface GroupedSessionStorageItem {
  sessionId: string;
  sessionTitle: string;
  activeVersion: string;
  totalFiles: number;
  updatedAt: string;
  files: StorageFileVersionItem[];
}

export const groupedStorageResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(
    z.object({
      sessionId: z.string(),
      sessionTitle: z.string(),
      activeVersion: z.string(),
      totalFiles: z.number(),
      updatedAt: z.string(),
      files: z.array(
        z.object({
          id: z.string(),
          fileName: z.string(),
          version: z.string(),
          versionId: z.string().optional(),
          type: z.enum(['ai', 'manual']).optional(),
          s3Key: z.string(),
          sizeBytes: z.number(),
          sizeFormatted: z.string(),
          presignedUrl: z.string().optional(),
          isActive: z.boolean(),
          createdAt: z.string(),
        })
      ),
    })
  ),
});
