import {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  GetBucketVersioningCommand,
  PutBucketVersioningCommand,
  ListObjectVersionsCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../config/s3.config';
import { env } from '../config/env.config';

export interface S3CustomMetadata {
  sessionId?: string;
  sessionTitle?: string;
  version?: string;
  userId?: string;
  fileName?: string;
  [key: string]: string | undefined;
}

export interface S3UserFileItem {
  id: string;
  s3Key: string;
  userId: string;
  sessionId: string;
  sessionTitle: string;
  fileName: string;
  version: string;
  sizeBytes: number;
  presignedUrl: string;
  presignedExpiresAt: number;
  createdAt: string;
}

export class S3Service {
  private bucketName: string = env.s3BucketName;

  /**
   * Tự động kiểm tra và kích hoạt S3 Bucket Versioning nếu chưa được bật
   */
  public async ensureBucketVersioningEnabled(): Promise<boolean> {
    try {
      const checkCmd = new GetBucketVersioningCommand({ Bucket: this.bucketName });
      const res = await s3Client.send(checkCmd);
      if (res.Status !== 'Enabled') {
        const enableCmd = new PutBucketVersioningCommand({
          Bucket: this.bucketName,
          VersioningConfiguration: { Status: 'Enabled' },
        });
        await s3Client.send(enableCmd);
        console.log(`[S3Service] Đã kích hoạt Native Versioning cho Bucket: ${this.bucketName}`);
      } else {
        console.log(`[S3Service] Bucket ${this.bucketName} đã kích hoạt Native Versioning sẵn sàng.`);
      }
      return true;
    } catch (err) {
      console.warn('[S3Service] Kiểm tra Bucket Versioning:', err);
      return false;
    }
  }

  /**
   * Tự động kiểm tra và cấu hình chính sách Anonymous Read (Chỉ đọc công khai)
   * cho riêng thư mục images/ của các session và thư mục public-media/ trên MinIO,
   * trong khi bảo vệ tuyệt đối 100% các file mã nguồn index.html là Private.
   */
  public async ensurePublicBucketPolicyEnabled(): Promise<boolean> {
    try {
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowPublicReadImagesOnly',
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [
              `arn:aws:s3:::${this.bucketName}/users/*/sessions/*/images/*`,
              `arn:aws:s3:::${this.bucketName}/public-media/*`,
            ],
          },
        ],
      };

      await s3Client.send(
        new PutBucketPolicyCommand({
          Bucket: this.bucketName,
          Policy: JSON.stringify(policy),
        })
      );
      console.log(`[S3Service] Đã kích hoạt Public Policy cho thư mục images/ và public-media/ trên Bucket: ${this.bucketName}`);
      return true;
    } catch (err) {
      console.warn('[S3Service] Kiểm tra Bucket Policy:', err);
      return false;
    }
  }

  /**
   * Upload file HTML lên MinIO/S3 kèm S3 Custom Metadata (x-amz-meta-*),
   * trả về VersionId tự sinh từ S3 khi ghi đè thành công.
   */
  public async uploadHtml(
    s3Key: string,
    htmlContent: string,
    metadata?: S3CustomMetadata
  ): Promise<{ versionId?: string }> {
    try {
      // Mã hóa an toàn các giá trị metadata thành ASCII hợp lệ cho S3 HTTP Header
      const s3Metadata: Record<string, string> = {};
      if (metadata) {
        for (const [key, value] of Object.entries(metadata)) {
          if (value !== undefined && value !== null) {
            s3Metadata[key.toLowerCase()] = encodeURIComponent(String(value));
          }
        }
      }

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: Buffer.from(htmlContent, 'utf-8'),
        ContentType: 'text/html; charset=utf-8',
        CacheControl: 'max-age=3600, private',
        Metadata: Object.keys(s3Metadata).length > 0 ? s3Metadata : undefined,
      });
      const response = await s3Client.send(command);
      return { versionId: response.VersionId };
    } catch (error) {
      console.error(`[S3Service] Error uploading HTML to key: ${s3Key}`, error);
      throw error;
    }
  }

  /**
   * Sinh đường dẫn Public Static URL vĩnh viễn cho tệp hình ảnh lưu trên MinIO/S3,
   * hoàn toàn không kèm query parameters hay chữ ký HMAC tạm thời.
   */
  public getPublicStaticUrl(s3Key: string): string {
    const endpoint = (env.s3Endpoint || 'http://127.0.0.1:9000').replace(/\/+$/, '');
    const cleanKey = s3Key.replace(/^\/+/, '');
    return `${endpoint}/${this.bucketName}/${cleanKey}`;
  }

  /**
   * Upload tệp hình ảnh dạng Buffer (được bóc tách từ Base64) lên thư mục images của MinIO
   * và sinh ngay Public Static URL vĩnh viễn (0ms, không bao giờ hết hạn) cho ảnh.
   */
  public async uploadImageBuffer(
    s3Key: string,
    buffer: Buffer,
    contentType: string = 'image/png'
  ): Promise<{ staticUrl: string }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'max-age=31536000, public',
      });
      await s3Client.send(command);

      return {
        staticUrl: this.getPublicStaticUrl(s3Key),
      };
    } catch (error) {
      console.error(`[S3Service] Error uploading image to key: ${s3Key}`, error);
      throw error;
    }
  }

  /**
   * Lấy S3 Custom Metadata gắn kèm file qua HeadObjectCommand (0 bytes download payload)
   */
  public async getObjectMetadata(s3Key: string): Promise<S3CustomMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });
      const response = await s3Client.send(command);
      if (!response.Metadata) return {};

      const decoded: S3CustomMetadata = {};
      for (const [key, value] of Object.entries(response.Metadata)) {
        try {
          decoded[key] = decodeURIComponent(value);
        } catch {
          decoded[key] = value;
        }
      }
      return decoded;
    } catch (error) {
      console.warn(`[S3Service] HeadObject error for key ${s3Key}:`, error);
      return null;
    }
  }

  /**
   * Quét và lấy toàn bộ danh sách file HTML thực tế của user trên S3 (Zero-DB Reading)
   */
  public async listUserFiles(userId: string): Promise<S3UserFileItem[]> {
    const userPrefix = `users/${userId}/`;
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: userPrefix,
      });

      const response = await s3Client.send(command);
      const contents = response.Contents || [];
      const htmlFiles = contents.filter((item) => item.Key && item.Key.endsWith('.html'));

      const fileItems = await Promise.all(
        htmlFiles.map(async (item) => {
          const s3Key = item.Key!;
          const meta = (await this.getObjectMetadata(s3Key)) || {};

          // Ký Presigned View URL (Hạn 4 tiếng)
          const s3Info = await this.getOrGeneratePresignedViewUrl(s3Key);

          // Phân tích fallback từ s3Key: users/<userId>/sessions/<sessionId>/<version>.html
          const parts = s3Key.split('/');
          const sessionFromPath = parts.length >= 4 ? parts[3] : '';
          const rawFileName = parts[parts.length - 1] || 'website.html';
          const versionFromPath = rawFileName.replace('.html', '');

          const createdAt = item.LastModified ? item.LastModified.toISOString() : new Date().toISOString();

          return {
            id: s3Key.replace(/[^a-zA-Z0-9_-]/g, '_'),
            s3Key,
            userId,
            sessionId: meta.sessionid || sessionFromPath,
            sessionTitle: meta.sessiontitle || 'Phiên làm việc',
            fileName: meta.filename || rawFileName,
            version: meta.version || versionFromPath,
            sizeBytes: item.Size || 0,
            presignedUrl: s3Info.presignedUrl,
            presignedExpiresAt: s3Info.presignedExpiresAt,
            createdAt,
          };
        })
      );

      // Sắp xếp giảm dần theo thời gian tạo mới nhất
      return fileItems.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error(`[S3Service] Error listing user files for userId ${userId}:`, error);
      return [];
    }
  }

  /**
   * Lấy hoặc tạo mới Presigned URL xem Live Preview (Hạn 4 tiếng = 14400s).
   * - Hỗ trợ versionId: Nếu truyền versionId, sẽ ký link xem đúng phiên bản đó.
   * - Tái sử dụng link cũ từ Database nếu chưa hết hạn để chống spam F5 và tối ưu 0ms.
   */
  public async getOrGeneratePresignedViewUrl(
    s3Key: string,
    cachedUrl?: string,
    cachedExpiresAt?: number,
    versionId?: string
  ): Promise<{ presignedUrl: string; presignedExpiresAt: number }> {
    const now = Date.now();
    const safetyBufferMs = 5 * 60 * 1000; // 5 phút trừ hao an toàn

    // 1. Kiểm tra cache còn hạn: Nếu còn hạn và không chỉ định versionId thì trả về ngay link cũ (0ms, không gọi S3 SDK)
    if (!versionId && cachedUrl && cachedExpiresAt && cachedExpiresAt - now > safetyBufferMs) {
      return {
        presignedUrl: cachedUrl,
        presignedExpiresAt: cachedExpiresAt,
      };
    }

    // 2. Ký link mới có thời hạn 4 tiếng (14400 giây)
    const expiresInSeconds = 14400;
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        VersionId: versionId || undefined,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: expiresInSeconds,
      });

      const presignedExpiresAt = now + expiresInSeconds * 1000;

      return {
        presignedUrl,
        presignedExpiresAt,
      };
    } catch (error) {
      console.error(`[S3Service] Error generating presigned view URL for key: ${s3Key}, versionId: ${versionId}`, error);
      return {
        presignedUrl: '',
        presignedExpiresAt: 0,
      };
    }
  }

  /**
   * Sinh Presigned URL để AI Agent bên thứ 3 fetch mã nguồn dạng text/plain thô,
   * đảm bảo 100% không bị dịch sang Markdown khi tải bằng tool web_fetch.
   */
  public async getPresignedRawCodeUrl(s3Key: string, versionId?: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        VersionId: versionId || undefined,
        ResponseContentType: 'text/plain; charset=utf-8',
      });

      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600, // Hạn dùng 1 giờ
      });

      return signedUrl;
    } catch (error) {
      console.error(`[S3Service] Error generating presigned raw code URL for key: ${s3Key}:`, error);
      return '';
    }
  }

  /**
   * Đọc toàn bộ nội dung text của file HTML từ MinIO/S3 (Dùng làm context cho AI ở Turn 2+).
   * Hỗ trợ truyền versionId để đọc đúng nội dung của phiên bản cụ thể.
   */
  public async getHtmlContent(s3Key: string, versionId?: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        VersionId: versionId || undefined,
      });
      const response = await s3Client.send(command);
      if (!response.Body) return '';
      return await response.Body.transformToString('utf-8');
    } catch (error) {
      console.error(`[S3Service] Error reading HTML content for key: ${s3Key}, versionId: ${versionId}`, error);
      return '';
    }
  }

  /**
   * Ký Presigned URL trực tiếp để tải file về máy (Đính kèm header Content-Disposition: attachment).
   * Hỗ trợ tải đúng versionId cụ thể nếu có.
   */
  public async getPresignedDownloadUrl(s3Key: string, fileName: string, versionId?: string): Promise<string> {
    const sanitizedFileName = (fileName || 'skipli_canvas_website.html').replace(/"/g, '');
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        VersionId: versionId || undefined,
        ResponseContentDisposition: `attachment; filename="${sanitizedFileName}"`,
      });

      return await getSignedUrl(s3Client, command, {
        expiresIn: 10, // Link tải có hiệu lực trong 10 giây
      });
    } catch (error) {
      console.error(`[S3Service] Error generating presigned download URL for key: ${s3Key}, versionId: ${versionId}`, error);
      throw error;
    }
  }

  /**
   * Xóa vĩnh viễn một Version cụ thể của file trên MinIO / S3 (Dùng khi Rollback).
   */
  public async deleteObjectVersion(s3Key: string, versionId: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        VersionId: versionId,
      });
      await s3Client.send(command);
      return true;
    } catch (error) {
      console.error(`[S3Service] Error deleting object version for key: ${s3Key}, versionId: ${versionId}`, error);
      return false;
    }
  }

  /**
   * Liệt kê toàn bộ các version của một S3 Key (Sắp xếp từ mới nhất đến cũ nhất).
   */
  public async listObjectVersions(s3Key: string): Promise<Array<{
    versionId: string;
    isLatest: boolean;
    size: number;
    lastModified?: string;
  }>> {
    try {
      const command = new ListObjectVersionsCommand({
        Bucket: this.bucketName,
        Prefix: s3Key,
      });
      const response = await s3Client.send(command);
      const versions = response.Versions || [];
      return versions
        .filter((v) => v.Key === s3Key && v.VersionId)
        .map((v) => ({
          versionId: v.VersionId!,
          isLatest: Boolean(v.IsLatest),
          size: v.Size || 0,
          lastModified: v.LastModified ? v.LastModified.toISOString() : undefined,
        }));
    } catch (error) {
      console.error(`[S3Service] Error listing object versions for key: ${s3Key}`, error);
      return [];
    }
  }

  /**
   * Xóa file khỏi MinIO / S3 (Hoặc xóa Latest Marker)
   */
  public async deleteObject(s3Key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });
      await s3Client.send(command);
      return true;
    } catch (error) {
      console.error(`[S3Service] Error deleting object at key: ${s3Key}`, error);
      return false;
    }
  }

  /**
   * Xóa toàn bộ objects (bao gồm toàn bộ versions và delete markers) theo tiền tố prefix.
   * Dùng khi xóa 1 Session hoặc dọn dẹp sạch sẽ toàn bộ thư mục con trên MinIO.
   */
  public async deleteObjectsByPrefix(prefix: string): Promise<number> {
    try {
      let totalDeleted = 0;
      let isTruncated = true;
      let nextKeyMarker: string | undefined;
      let nextVersionIdMarker: string | undefined;

      while (isTruncated) {
        const listCmd = new ListObjectVersionsCommand({
          Bucket: this.bucketName,
          Prefix: prefix,
          KeyMarker: nextKeyMarker,
          VersionIdMarker: nextVersionIdMarker,
        });

        const res = await s3Client.send(listCmd);
        const objectsToDelete: { Key: string; VersionId?: string }[] = [];

        if (res.Versions && res.Versions.length > 0) {
          for (const v of res.Versions) {
            if (v.Key) {
              objectsToDelete.push({ Key: v.Key, VersionId: v.VersionId });
            }
          }
        }

        if (res.DeleteMarkers && res.DeleteMarkers.length > 0) {
          for (const d of res.DeleteMarkers) {
            if (d.Key) {
              objectsToDelete.push({ Key: d.Key, VersionId: d.VersionId });
            }
          }
        }

        if (objectsToDelete.length > 0) {
          const deleteCmd = new DeleteObjectsCommand({
            Bucket: this.bucketName,
            Delete: {
              Objects: objectsToDelete,
              Quiet: true,
            },
          });
          await s3Client.send(deleteCmd);
          totalDeleted += objectsToDelete.length;
        }

        isTruncated = Boolean(res.IsTruncated);
        nextKeyMarker = res.NextKeyMarker;
        nextVersionIdMarker = res.NextVersionIdMarker;
      }

      return totalDeleted;
    } catch (error) {
      console.error(`[S3Service] Error deleting objects by prefix ${prefix}:`, error);
      return 0;
    }
  }

  /**
   * Tự động quét và dọn dẹp các tệp ảnh mồ côi trong thư mục images/ của session trên MinIO
   * (khi người dùng thay thế ảnh bằng ảnh khác khi edit manually, hoặc rollback về phiên bản trước).
   */
  public async cleanupUnreferencedSessionImages(
    userId: string,
    sessionId: string,
    activeHtml: string
  ): Promise<string[]> {
    const prefix = `users/${userId}/sessions/${sessionId}/images/`;
    const deletedKeys: string[] = [];

    try {
      const listCmd = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const res = await s3Client.send(listCmd);
      if (!res.Contents || res.Contents.length === 0) {
        return [];
      }

      for (const item of res.Contents) {
        if (!item.Key) continue;
        const fileName = item.Key.split('/').pop() || '';
        // Nếu tên file ảnh không còn xuất hiện trong chuỗi HTML hiện tại
        if (fileName && !activeHtml.includes(fileName)) {
          await this.deleteObjectsByPrefix(item.Key);
          deletedKeys.push(item.Key);
          console.log(`[S3Service] Đã dọn dẹp ảnh bị thay thế/hủy bỏ trên MinIO: ${item.Key}`);
        }
      }

      return deletedKeys;
    } catch (error) {
      console.error(`[S3Service] Error cleaning up unreferenced images for session ${sessionId}:`, error);
      return [];
    }
  }
}

export const s3Service = new S3Service();


