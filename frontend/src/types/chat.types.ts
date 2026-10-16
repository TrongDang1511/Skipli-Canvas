export type Sender = 'user' | 'ai' | 'system';

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  time: string;
  version?: string;
  s3VersionId?: string;
  eventType?: 'manual_edit' | 'prompt_rollback';
  extractedHtml?: string;
  isLoading?: boolean;
}

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';
export type ViewMode = 'preview' | 'code';

export interface ChatApiResponse {
  success: boolean;
  data: {
    sessionId: string;
    version: string;
    fullContent: string;
    extractedHtml: string;
    presignedUrl?: string;
    s3Key?: string;
    userMessageId?: string;
    aiMessageId?: string;
  };
}

