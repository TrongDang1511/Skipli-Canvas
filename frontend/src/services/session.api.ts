import { apiClient } from './api';
import { Session, SessionDetail } from '../types/session.types';
import { ChatMessage } from '../types/chat.types';

export interface RollbackTurnResult {
  sessionId: string;
  cutoffUserMessageId: string;
  deletedMessagesCount: number;
  deletedS3Keys: string[];
  restoredVersion: string | null;
  restoredS3Key: string | null;
  restoredHtml: string | null;
  presignedUrl: string | null;
}

export class SessionApiService {
  public async fetchSessions(): Promise<Session[]> {
    const res = await apiClient.get('/sessions');
    return res.data.data;
  }

  public async fetchSessionDetail(id: string): Promise<SessionDetail> {
    const res = await apiClient.get(`/sessions/${id}`);
    return res.data.data;
  }

  public async createSession(title: string, initialPrompt?: string): Promise<Session> {
    const res = await apiClient.post('/sessions', { title, initialPrompt });
    return res.data.data;
  }

  public async renameSession(id: string, title: string): Promise<Session> {
    const res = await apiClient.patch(`/sessions/${id}`, { title });
    return res.data.data;
  }

  public async deleteSession(id: string): Promise<void> {
    await apiClient.delete(`/sessions/${id}`);
  }

  public async overwriteCanvas(
    id: string,
    cleanHtml: string
  ): Promise<{
    success: boolean;
    sessionId: string;
    presignedUrl: string;
    cleanHtml: string;
    updatedAt: string;
    milestoneMessage?: ChatMessage;
  }> {
    const res = await apiClient.put(`/sessions/${id}/overwrite-canvas`, { cleanHtml });
    return res.data.data;
  }

  public async rollbackUserTurn(
    sessionId: string,
    userMessageId: string,
    promptText?: string
  ): Promise<RollbackTurnResult> {
    const res = await apiClient.post(`/sessions/${sessionId}/rollback-user-turn`, {
      userMessageId,
      promptText,
    });
    return res.data.data;
  }

  public async rollbackMilestone(
    sessionId: string,
    milestoneMessageId: string
  ): Promise<RollbackTurnResult> {
    const res = await apiClient.post(`/sessions/${sessionId}/rollback-milestone`, {
      milestoneMessageId,
    });
    return res.data.data;
  }
}

export const sessionApi = new SessionApiService();
