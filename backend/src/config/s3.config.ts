import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { env } from './env.config';

const s3Config: S3ClientConfig = {
  region: env.s3Region || 'us-east-1',
  credentials: {
    accessKeyId: env.s3AccessKeyId,
    secretAccessKey: env.s3SecretAccessKey,
  },
  forcePathStyle: env.s3ForcePathStyle,
};

// Nếu endpoint được cấu hình (dành cho MinIO local hoặc S3 compatible storage)
if (env.s3Endpoint && env.s3Endpoint.trim()) {
  s3Config.endpoint = env.s3Endpoint.trim();
}

export const s3Client = new S3Client(s3Config);
