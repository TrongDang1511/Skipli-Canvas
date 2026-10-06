import { apiClient } from './api';
import { Session, SessionDetail } from '../types/session.types';

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
}

export const sessionApi = new SessionApiService();
