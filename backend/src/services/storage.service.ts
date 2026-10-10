import { StorageFileMetadata } from '../models/storage.model';
import { storageRepository } from '../repositories/storage.repository';
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
    // 1. Tìm file trong danh sách thực tế của S3
    const userFiles = await s3Service.listUserFiles(userId);
    const target = userFiles.find(
      (f) => f.id === fileIdOrS3Key || f.s3Key === fileIdOrS3Key
    );

    let s3KeyToUse = target ? target.s3Key : fileIdOrS3Key;
    let fileNameToUse = target ? target.fileName : 'skipli_canvas_website.html';

    // 2. Nếu không có trong s3 list trực tiếp, thử tra cứu trong repository
    if (!target) {
      const repoFile = await storageRepository.findFileById(fileIdOrS3Key, userId);
      if (repoFile && repoFile.s3Key) {
        s3KeyToUse = repoFile.s3Key;
        fileNameToUse = repoFile.fileName || fileNameToUse;
      }
    }

    try {
      const downloadUrl = await s3Service.getPresignedDownloadUrl(s3KeyToUse, fileNameToUse);
      return { downloadUrl, fileName: fileNameToUse };
    } catch (err) {
      console.warn(`[StorageService] Get presigned download URL error for key ${s3KeyToUse}:`, err);
      return null;
    }
  }

  /**
   * Xóa file vật lý khỏi MinIO / S3 và dọn dẹp metadata
   */
  public async deleteStorageFile(userId: string, fileIdOrS3Key: string): Promise<boolean> {
    const userFiles = await s3Service.listUserFiles(userId);
    const target = userFiles.find(
      (f) => f.id === fileIdOrS3Key || f.s3Key === fileIdOrS3Key
    );

    const s3KeyToDelete = target ? target.s3Key : fileIdOrS3Key;
    const deletedS3 = await s3Service.deleteObject(s3KeyToDelete);

    // Đồng thời xóa bản ghi lưu ở repository nếu có
    await storageRepository.deleteFile(fileIdOrS3Key, userId);

    return deletedS3;
  }
}

export const storageService = new StorageService();


