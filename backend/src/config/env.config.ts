import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  goclawUrl: process.env.GOCLAW_URL || '',
  goclawGatewayToken: process.env.GOCLAW_GATEWAY_TOKEN || '',
  goclawAgentId: process.env.GOCLAW_AGENT_ID || '',
  goclawWorkspaceDir: process.env.GOCLAW_WORKSPACE_DIR || '',
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',

  // JWT Configuration (100% từ .env - Không gán chuỗi bí mật tĩnh trong source code)
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // S3 / MinIO Storage Configuration
  s3Endpoint: process.env.S3_ENDPOINT || '',
  s3Region: process.env.S3_REGION || 'us-east-1',
  s3BucketName: process.env.S3_BUCKET_NAME || 'skipli-canvas-storage',
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || '',
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true' || process.env.S3_FORCE_PATH_STYLE === '1'
};
