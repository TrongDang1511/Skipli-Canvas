export interface Session {
  id: string;
  userId: string;
  title: string;
  latestHtml: string;
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
