export interface Session {
  id: string;
  userId: string;
  title: string;
  latestHtml: string;
  s3Key?: string;
  presignedUrl?: string;
  presignedExpiresAt?: number;
  versionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionMessage {
  id: string;
  sessionId: string;
  userId: string;
  sender: 'user' | 'ai';
  text: string;
  thinkingContent?: string;
  extractedHtml?: string;
  version?: string;
  createdAt: string;
}

export interface SessionDetail {
  session: Session;
  messages: SessionMessage[];
}

export interface StorageItem {
  id: string;
  sessionId: string;
  sessionTitle: string;
  version: string;
  htmlContent: string;
  createdAt: string;
  sizeBytes: number;
}
