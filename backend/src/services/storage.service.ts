import { StorageFileMetadata } from '../models/storage.model';
import { s3Service } from './s3.service';
import { sessionRepository } from '../repositories/session.repository';
import { GroupedSessionStorageItem, StorageFileVersionItem } from '../dtos/storage.dto';

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export class StorageService {
  /**
   * Quét và lấy danh sách file thực tế từ MinIO / S3 (Zero-DB Reading)
   */
  public async getUserStorageFiles(userId: string): Promise<StorageFileMetadata[]> {
    const s3Files = await s3Service.listUserFiles(userId);
    return s3Files;
  }

  /**
   * Lấy danh sách file lưu trữ được phân nhóm logic theo từng Session.
   * Tính toán dung lượng formatted, đánh dấu phiên bản isActive đang hiển thị trên Canvas.
   */
  public async getGroupedStorageFiles(userId: string): Promise<GroupedSessionStorageItem[]> {
    // 1. Lấy danh sách sessions của user từ Firestore / Memory
    const sessions = await sessionRepository.findSessionsByUserId(userId);
    const sessionMap = new Map<string, (typeof sessions)[0]>();
    for (const s of sessions) {
      sessionMap.set(s.id, s);
    }

    // 2. Lấy toàn bộ file thực tế của user từ MinIO S3
    const s3Files = await s3Service.listUserFiles(userId);

    // 3. Gom nhóm file theo sessionId
    const groupedMap = new Map<string, GroupedSessionStorageItem>();

    for (const file of s3Files) {
      const sessionId = file.sessionId;
      if (!sessionId) continue;

      const session = sessionMap.get(sessionId);
      const sessionTitle = session?.title || file.sessionTitle || 'Dự án không tên';
      const sessionUpdatedAt = session?.updatedAt || file.createdAt;

      // Xác định activeVersion của session (từ session.s3Key hoặc session.versionCount)
      let activeVersion = 'v1.1';
      if (session?.s3Key) {
        const match = session.s3Key.match(/(v1\.\d+)\.html/i);
        if (match) activeVersion = match[1];
      } else if (session?.versionCount) {
        activeVersion = `v1.${session.versionCount}`;
      }

      // Xác định file này có đang là file active của session không
      const isActive = Boolean(session?.s3Key && session.s3Key === file.s3Key);

      let group = groupedMap.get(sessionId);
      if (!group) {
        group = {
          sessionId,
          sessionTitle,
          activeVersion,
          totalFiles: 0,
          updatedAt: sessionUpdatedAt,
          files: [],
        };
        groupedMap.set(sessionId, group);
      }

      const versionItem: StorageFileVersionItem = {
        id: file.id,
        fileName: file.fileName,
        version: file.version,
        s3Key: file.s3Key,
        sizeBytes: file.sizeBytes,
        sizeFormatted: formatBytes(file.sizeBytes),
        presignedUrl: file.presignedUrl,
        isActive,
        createdAt: file.createdAt,
      };

      group.files.push(versionItem);
      group.totalFiles = group.files.length;

      // Cập nhật sessionUpdatedAt nếu có file mới hơn
      if (new Date(file.createdAt).getTime() > new Date(group.updatedAt).getTime()) {
        group.updatedAt = file.createdAt;
      }
    }

    // 4. Sắp xếp các file trong mỗi nhóm từ mới nhất đến cũ nhất (v1.2 ở trên, v1.1 ở dưới)
    const result: GroupedSessionStorageItem[] = [];
    for (const group of groupedMap.values()) {
      group.files.sort((a, b) => {
        const verNumA = parseFloat(a.version.replace('v', '')) || 0;
        const verNumB = parseFloat(b.version.replace('v', '')) || 0;
        if (verNumA !== verNumB) return verNumB - verNumA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      result.push(group);
    }

    // 5. Sắp xếp các Session theo updatedAt giảm dần (Session nào vừa tương tác thì lên đầu)
    return result.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
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



