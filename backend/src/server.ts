import app from './app';
import { env } from './config/env.config';
import { s3Service } from './services/s3.service';

const PORT = env.port;

const server = app.listen(PORT, async () => {
  console.log(`[Server] Skipli Canvas Backend running on http://localhost:${PORT}`);
  // Tự động kiểm tra và đảm bảo S3/MinIO Bucket đã kích hoạt Native Versioning
  await s3Service.ensureBucketVersioningEnabled();
});

server.setTimeout(0);
server.keepAliveTimeout = 0;
