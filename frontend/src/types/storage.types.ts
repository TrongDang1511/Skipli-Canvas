export interface StorageFileItem {
  id: string;
  userId: string;
  sessionId: string;
  sessionTitle: string;
  fileName: string;
  s3Key?: string;
  presignedUrl?: string;
  presignedExpiresAt?: number;
  sizeBytes: number;
  version: string;
  createdAt: string;
}

export interface StorageApiResponse {
  success: boolean;
  data: StorageFileItem[];
}
