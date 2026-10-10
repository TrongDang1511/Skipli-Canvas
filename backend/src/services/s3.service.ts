import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../config/s3.config';
import { env } from '../config/env.config';

export class S3Service {
  private bucketName: string = env.s3BucketName;

  /**
   * Upload file HTML lên MinIO/S3 với Content-Type text/html; charset=utf-8
   */
  public async uploadHtml(s3Key: string, htmlContent: string): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
        Body: Buffer.from(htmlContent, 'utf-8'),
        ContentType: 'text/html; charset=utf-8',
      });
      await s3Client.send(command);
    } catch (error) {
      console.error(`[S3Service] Error uploading HTML to key: ${s3Key}`, error);
      throw error;
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
        expiresIn: 3600, // Link tải có hiệu lực trong 1 tiếng
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
