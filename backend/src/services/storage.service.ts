import { randomUUID } from 'crypto';
import path from 'path';
import { StorageFile, StorageFileMetadata } from '../models/storage.model';
import { storageRepository } from '../repositories/storage.repository';

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
    customFileName?: string
  ): Promise<StorageFile | null> {
    if (!htmlContent || !htmlContent.trim()) {
      return null;
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const fileName = resolveFileName(sessionTitle, version, htmlContent, customFileName);
    const sizeBytes = Buffer.byteLength(htmlContent, 'utf-8');

    const newFile: StorageFile = {
      id,
      userId,
      sessionId,
      sessionTitle: sessionTitle || 'Phiên làm việc mới',
      fileName,
      htmlContent: htmlContent.trim(),
      sizeBytes,
      version: version || 'v1.1',
      createdAt: now,
    };

    return storageRepository.createStorageFile(newFile);
  }

  public async getUserStorageFiles(userId: string): Promise<StorageFileMetadata[]> {
    return storageRepository.findFilesByUserId(userId);
  }

  public async getFileForDownload(userId: string, fileId: string): Promise<StorageFile | null> {
    return storageRepository.findFileById(fileId, userId);
  }

  public async deleteStorageFile(userId: string, fileId: string): Promise<boolean> {
    return storageRepository.deleteFile(fileId, userId);
  }
}

export const storageService = new StorageService();
