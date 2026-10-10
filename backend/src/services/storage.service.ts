import { StorageFileMetadata } from '../models/storage.model';
import { s3Service } from './s3.service';

export class StorageService {
  /**
   * Quét và lấy danh sách file thực tế từ MinIO / S3 (Zero-DB Reading)
   */
  public async getUserStorageFiles(userId: string): Promise<StorageFileMetadata[]> {
    const s3Files = await s3Service.listUserFiles(userId);
    return s3Files;
  }

  /**
   * Tạo Presigned Download URL (Hạn 10s) cho file HTML trên S3
   */
  public async getFileForDownload(
    userId: string,
    fileIdOrS3Key: string
  ): Promise<{ downloadUrl: string; fileName: string } | null> {
    const userFiles = await s3Service.listUserFiles(userId);
    const target = userFiles.find(
      (f) => f.id === fileIdOrS3Key || f.s3Key === fileIdOrS3Key
    );

    const s3KeyToUse = target ? target.s3Key : fileIdOrS3Key;
    const fileNameToUse = target ? target.fileName : 'skipli_canvas_website.html';

    try {
      const downloadUrl = await s3Service.getPresignedDownloadUrl(s3KeyToUse, fileNameToUse);
      return { downloadUrl, fileName: fileNameToUse };
    } catch (err) {
      console.warn(`[StorageService] Get presigned download URL error for key ${s3KeyToUse}:`, err);
      return null;
    }
  }

  /**
   * Xóa file vật lý khỏi MinIO / S3
   */
  public async deleteStorageFile(userId: string, fileIdOrS3Key: string): Promise<boolean> {
    const userFiles = await s3Service.listUserFiles(userId);
    const target = userFiles.find(
      (f) => f.id === fileIdOrS3Key || f.s3Key === fileIdOrS3Key
    );

    const s3KeyToDelete = target ? target.s3Key : fileIdOrS3Key;
    const deletedS3 = await s3Service.deleteObject(s3KeyToDelete);
    return deletedS3;
  }
}

export const storageService = new StorageService();



