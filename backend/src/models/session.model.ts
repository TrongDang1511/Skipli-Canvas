export interface Session {
  id: string;
  userId: string;
  title: string;
  latestHtml: string;
  s3Key?: string;
  s3VersionId?: string;
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
  sender: 'user' | 'ai' | 'system';
  eventType?: 'manual_edit' | 'prompt_rollback';
  text: string;
  thinkingContent?: string;
  extractedHtml?: string;
  version?: string;
  s3VersionId?: string;
  createdAt: string;
}
