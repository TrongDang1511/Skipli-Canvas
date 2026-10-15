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

export interface StorageFileVersionItem {
  id: string;
  fileName: string;
  version: string;
  s3Key: string;
  sizeBytes: number;
  sizeFormatted: string;
  presignedUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface GroupedSessionStorageItem {
  sessionId: string;
  sessionTitle: string;
  activeVersion: string;
  totalFiles: number;
  updatedAt: string;
  files: StorageFileVersionItem[];
}

export interface GroupedStorageApiResponse {
  success: boolean;
  data: GroupedSessionStorageItem[];
}
