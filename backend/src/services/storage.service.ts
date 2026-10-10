import { randomUUID } from 'crypto';
import path from 'path';
import { StorageFile, StorageFileMetadata } from '../models/storage.model';
import { storageRepository } from '../repositories/storage.repository';
import { s3Service } from './s3.service';

function extractHtmlTitle(htmlContent: string): string | null {
  if (!htmlContent) return null;
  const match = htmlContent.match(/<title[^>]*>(.*?)<\/title>/i);
  if (match && match[1] && match[1].trim()) {
    const rawTitle = match[1].replace(/<[^>]*>?/gm, '').trim();
    if (rawTitle && rawTitle.length > 2) {
      return rawTitle;
    }
  }
  return null;
}

function resolveFileName(
  sessionTitle: string,
  version: string,
  htmlContent: string,
  customFileName?: string
): string {
  if (customFileName && customFileName.trim()) {
    const clean = customFileName.trim().replace(/^['"`]+|['"`]+$/g, '');
    const base = path.basename(clean);
    if (base && base.endsWith('.html')) {
      return base;
    }
    if (base) {
      return `${base}.html`;
    }
  }

  const htmlTitle = extractHtmlTitle(htmlContent);
  const titleToUse = htmlTitle || sessionTitle || 'skipli_canvas_website';

  const cleanTitle = titleToUse
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const baseSlug = cleanTitle || 'skipli_canvas_website';
  const cleanVer = (version || 'v1.1').replace(/[^a-z0-9.]/gi, '');
  return `${baseSlug}_${cleanVer}.html`;
}

export class StorageService {
  public async saveHtmlSnapshot(
    userId: string,
    sessionId: string,
    sessionTitle: string,
    version: string,
    htmlContent: string,
    customFileName?: string,
    s3Key?: string,
    presignedUrl?: string,
    presignedExpiresAt?: number
  ): Promise<StorageFile | null> {
    if ((!htmlContent || !htmlContent.trim()) && !s3Key) {
      return null;
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const fileName = resolveFileName(sessionTitle, version, htmlContent, customFileName);
    const sizeBytes = htmlContent ? Buffer.byteLength(htmlContent, 'utf-8') : 0;

    const newFile: StorageFile = {
      id,
      userId,
      sessionId,
      sessionTitle: sessionTitle || 'Phiên làm việc mới',
      fileName,
      htmlContent: s3Key ? '' : htmlContent.trim(),
      s3Key,
      presignedUrl,
      presignedExpiresAt,
      sizeBytes,
      version: version || 'v1.1',
      createdAt: now,
    };

    return storageRepository.createStorageFile(newFile);
  }

  public async getUserStorageFiles(userId: string): Promise<StorageFileMetadata[]> {
    const files = await storageRepository.findFilesByUserId(userId);

    // Tự động kiểm tra và làm mới Presigned URL cho các file trong kho nếu hết hạn
    const updatedFiles = await Promise.all(
      files.map(async (file) => {
        if (file.s3Key) {
          try {
            const s3Info = await s3Service.getOrGeneratePresignedViewUrl(
              file.s3Key,
              file.presignedUrl,
              file.presignedExpiresAt
            );
            if (s3Info.presignedUrl && s3Info.presignedUrl !== file.presignedUrl) {
              file.presignedUrl = s3Info.presignedUrl;
              file.presignedExpiresAt = s3Info.presignedExpiresAt;
            }
          } catch (err) {
            console.warn(`[StorageService] Refresh S3 view URL error for file ${file.id}:`, err);
          }
        }
        return file;
      })
    );

    return updatedFiles;
  }

  public async getFileForDownload(userId: string, fileId: string): Promise<{ file: StorageFile; downloadUrl?: string } | null> {
    const file = await storageRepository.findFileById(fileId, userId);
    if (!file) return null;

    let downloadUrl: string | undefined;

    if (file.s3Key) {
      try {
        downloadUrl = await s3Service.getPresignedDownloadUrl(file.s3Key, file.fileName);
      } catch (err) {
        console.warn(`[StorageService] Get presigned download URL error for key ${file.s3Key}:`, err);
      }
    }

    return { file, downloadUrl };
  }

  public async deleteStorageFile(userId: string, fileId: string): Promise<boolean> {
    const file = await storageRepository.findFileById(fileId, userId);
    if (!file) return false;

    if (file.s3Key) {
      await s3Service.deleteObject(file.s3Key);
    }

    return storageRepository.deleteFile(fileId, userId);
  }
}

export const storageService = new StorageService();

