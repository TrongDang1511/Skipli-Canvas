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
   * Hoạt động 100% trên cơ chế S3 Native Versioning của file index.html duy nhất.
   * Trích xuất chính xác nguồn gốc (AI vs Manual Edit), đánh dấu isActive và ký link Preview.
   */
  public async getGroupedStorageFiles(userId: string): Promise<GroupedSessionStorageItem[]> {
    // 1. Lấy danh sách sessions của user từ Firestore / Memory
    const sessions = await sessionRepository.findSessionsByUserId(userId);
    const result: GroupedSessionStorageItem[] = [];

    for (const session of sessions) {
      const s3Key = session.s3Key || `users/${userId}/sessions/${session.id}/index.html`;

      // 2. Lấy toàn bộ versions thực tế từ MinIO / S3
      const s3Versions = await s3Service.listObjectVersions(s3Key);
      if (!s3Versions || s3Versions.length === 0) {
        continue;
      }

      // 3. Lấy toàn bộ messages của session để map metadata (version, type, s3VersionId)
      const messages = await sessionRepository.findMessagesBySessionId(session.id, userId);
      const msgByVersionId = new Map<string, (typeof messages)[0]>();
      for (const msg of messages) {
        if (msg.s3VersionId) {
          msgByVersionId.set(msg.s3VersionId, msg);
        }
      }

      // 4. Xác định activeVersion của session
      let activeVersion = 'v1.1';
      if (session.s3VersionId && msgByVersionId.has(session.s3VersionId)) {
        activeVersion = (msgByVersionId.get(session.s3VersionId)!.version || 'v1.1')
          .replace(/\s*\([^)]*\)/g, '')
          .trim();
      } else if (session.versionCount > 0) {
        activeVersion = `v1.${session.versionCount}`;
      }

      // 5. Duyệt từng version từ S3 và tạo StorageFileVersionItem
      const files: StorageFileVersionItem[] = [];
      for (const v of s3Versions) {
        const msg = msgByVersionId.get(v.versionId);
        const isManual = msg?.sender === 'system' || msg?.eventType === 'manual_edit';
        const type: 'ai' | 'manual' = isManual ? 'manual' : 'ai';
        const rawVersion = msg?.version || (v.isLatest ? activeVersion : 'v1.X');
        const versionLabel = rawVersion.replace(/\s*\([^)]*\)/g, '').trim();
        const isActive = Boolean(session.s3VersionId ? session.s3VersionId === v.versionId : v.isLatest);

        // Ký Presigned View URL cho version này
        const s3Info = await s3Service.getOrGeneratePresignedViewUrl(s3Key, undefined, undefined, v.versionId);

        files.push({
          id: `${s3Key.replace(/[^a-zA-Z0-9_-]/g, '_')}__${v.versionId}`,
          fileName: 'index.html',
          version: versionLabel,
          versionId: v.versionId,
          type,
          s3Key,
          sizeBytes: v.size,
          sizeFormatted: formatBytes(v.size),
          presignedUrl: s3Info.presignedUrl,
          isActive,
          createdAt: v.lastModified || msg?.createdAt || session.updatedAt,
        });
      }

      // Sắp xếp các files trong session theo thời gian tạo mới nhất lên đầu
      files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      result.push({
        sessionId: session.id,
        sessionTitle: session.title || 'Dự án không tên',
        activeVersion,
        totalFiles: files.length,
        updatedAt: session.updatedAt || (files[0]?.createdAt ?? new Date().toISOString()),
        files,
      });
    }

    // 6. Sắp xếp các Session theo updatedAt giảm dần (Session nào vừa tương tác thì lên đầu)
    return result.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * Tạo Presigned Download URL (Hạn 10s) cho file HTML trên S3.
   * Hỗ trợ tải đúng versionId cụ thể nếu người dùng chọn phiên bản trong quá khứ.
   */
  public async getFileForDownload(
    userId: string,
    fileIdOrS3Key: string,
    versionId?: string
  ): Promise<{ downloadUrl: string; fileName: string } | null> {
    let s3Key = fileIdOrS3Key;
    let targetVersionId = versionId;

    // Phân tích nếu fileId có dạng `${s3Key}__${versionId}`
    if (fileIdOrS3Key.includes('__')) {
      const parts = fileIdOrS3Key.split('__');
      if (parts.length >= 2) {
        targetVersionId = targetVersionId || parts[parts.length - 1];
        s3Key = parts[0];
      }
    }

    // Nếu s3Key là dạng id encode (users_..._index_html), tìm lại session gốc
    if (s3Key.startsWith('users_')) {
      const sessions = await sessionRepository.findSessionsByUserId(userId);
      for (const s of sessions) {
        if (s3Key.includes(s.id)) {
          s3Key = s.s3Key || `users/${userId}/sessions/${s.id}/index.html`;
          break;
        }
      }
    }

    // Chuẩn hóa định dạng s3Key nếu thiếu tiền tố
    if (!s3Key.startsWith(`users/${userId}/`)) {
      const cleanParts = s3Key.split('sessions/');
      if (cleanParts.length >= 2) {
        s3Key = `users/${userId}/sessions/${cleanParts[1]}`;
      }
    }

    const fileName = 'index.html';

    try {
      const downloadUrl = await s3Service.getPresignedDownloadUrl(s3Key, fileName, targetVersionId);
      return { downloadUrl, fileName };
    } catch (err) {
      console.warn(`[StorageService] Lỗi tạo presigned download URL cho key ${s3Key}, versionId: ${targetVersionId}:`, err);
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



