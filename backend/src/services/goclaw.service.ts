import axios from 'axios';
import { Readable } from 'stream';
import { goclawConfig } from '../config/goclaw.config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class GoClawService {
  public async streamChatCompletion(
    prompt: string,
    history: ChatMessage[] = []
  ): Promise<Readable> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: goclawConfig.systemPrompt,
      },
      ...history,
      {
        role: 'user',
        content: prompt,
      },
    ];

    try {
      const response = await axios.post(
        goclawConfig.completionsEndpoint,
        {
          model: goclawConfig.agentId,
          messages,
          stream: true,
          max_tokens: 8192,
          tools: [],
          tool_choice: 'none',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${goclawConfig.gatewayToken}`,
            'X-GoClaw-User-Id': goclawConfig.userId,
            'X-GoClaw-Agent-Id': goclawConfig.agentId,
          },
          responseType: 'stream',
          timeout: 300000,
        }
      );

      return response.data as Readable;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data
          ? JSON.stringify(error.response.data)
          : error.message;
        throw new Error(`GoClaw Engine Error: ${errorMsg}`);
      }
      throw error;
    }
  }

  public extractHtml(fullContent: string): string {
    const htmlBlockRegex = /```html\s*([\s\S]*?)\s*```/i;
    const match = fullContent.match(htmlBlockRegex);
    if (match && match[1]) {
      return match[1].trim();
    }

    if (fullContent.includes('<html') || fullContent.includes('<div')) {
      return fullContent.trim();
    }

    return '';
  }
}

export const goclawService = new GoClawService();
