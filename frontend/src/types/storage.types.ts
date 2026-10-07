export interface StorageFileItem {
  id: string;
  userId: string;
  sessionId: string;
  sessionTitle: string;
  fileName: string;
  sizeBytes: number;
  version: string;
  createdAt: string;
}

export interface StorageApiResponse {
  success: boolean;
  data: StorageFileItem[];
}
