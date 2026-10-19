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

// S3 Client duy nhất cho toàn bộ hệ thống (nạp 100% từ S3_ENDPOINT trong .env)
export const s3Client = new S3Client({
  ...s3Config,
  ...(env.s3Endpoint && env.s3Endpoint.trim() ? { endpoint: env.s3Endpoint.trim() } : {}),
});


