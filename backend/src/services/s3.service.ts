import {
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
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
   * Upload file HTML lên MinIO/S3 kèm S3 Custom Metadata (x-amz-meta-*)
   */
  public async uploadHtml(
    s3Key: string,
    htmlContent: string,
    metadata?: S3CustomMetadata
  ): Promise<void> {
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
      await s3Client.send(command);
    } catch (error) {
      console.error(`[S3Service] Error uploading HTML to key: ${s3Key}`, error);
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
   * Tái sử dụng link cũ từ Database nếu chưa hết hạn để chống spam F5 và tối ưu 0ms.
   */
  public async getOrGeneratePresignedViewUrl(
    s3Key: string,
    cachedUrl?: string,
    cachedExpiresAt?: number
  ): Promise<{ presignedUrl: string; presignedExpiresAt: number }> {
    const now = Date.now();
    const safetyBufferMs = 5 * 60 * 1000; // 5 phút trừ hao an toàn

    // 1. Kiểm tra cache còn hạn: Nếu còn hạn thì trả về ngay link cũ (0ms, không gọi S3 SDK)
    if (cachedUrl && cachedExpiresAt && cachedExpiresAt - now > safetyBufferMs) {
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
      console.error(`[S3Service] Error generating presigned view URL for key: ${s3Key}`, error);
      return {
        presignedUrl: '',
        presignedExpiresAt: 0,
      };
    }
  }

  /**
   * Ký Presigned URL trực tiếp để tải file về máy (Đính kèm header Content-Disposition: attachment)
   */
  public async getPresignedDownloadUrl(s3Key: string, fileName: string): Promise<string> {
    const sanitizedFileName = (fileName || 'skipli_canvas_website.html').replace(/"/g, '');
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        ResponseContentDisposition: `attachment; filename="${sanitizedFileName}"`,
      });

      return await getSignedUrl(s3Client, command, {
        expiresIn: 10, // Link tải có hiệu lực trong 10 giây
      });
    } catch (error) {
      console.error(`[S3Service] Error generating presigned download URL for key: ${s3Key}`, error);
      throw error;
    }
  }

  /**
   * Xóa file khỏi MinIO / S3
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
}

export const s3Service = new S3Service();


