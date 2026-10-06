export type Sender = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  time: string;
  version?: string;
  steps?: string[];
  extractedHtml?: string;
  thinkingContent?: string;
  isStreaming?: boolean;
}

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';
export type ViewMode = 'preview' | 'code';

export type SSEEvent =
  | { type: 'token'; token: string }
  | { type: 'complete'; fullContent: string; extractedHtml: string }
  | { type: 'error'; error: string };
