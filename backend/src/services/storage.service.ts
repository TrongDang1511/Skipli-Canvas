import { randomUUID } from 'crypto';
import { StorageFile, StorageFileMetadata } from '../models/storage.model';
import { storageRepository } from '../repositories/storage.repository';

function slugifyFileName(title: string, version: string): string {
  const cleanTitle = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const base = cleanTitle || 'skipli_canvas_website';
  const cleanVer = (version || 'v1.1').replace(/[^a-z0-9.]/gi, '');
  return `${base}_${cleanVer}.html`;
}

export class StorageService {
  public async saveHtmlSnapshot(
    userId: string,
    sessionId: string,
    sessionTitle: string,
    version: string,
    htmlContent: string
  ): Promise<StorageFile | null> {
    if (!htmlContent || !htmlContent.trim()) {
      return null;
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const fileName = slugifyFileName(sessionTitle, version);
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
