import { randomUUID } from 'crypto';
import path from 'path';
import { Session, SessionMessage } from '../models/session.model';
import { sessionRepository } from '../repositories/session.repository';
import { storageService } from './storage.service';

export class SessionService {
  public async getUserSessions(userId: string): Promise<Session[]> {
    return sessionRepository.findSessionsByUserId(userId);
  }

  public async getSessionDetail(userId: string, sessionId: string): Promise<{ session: Session; messages: SessionMessage[] } | null> {
    const session = await sessionRepository.findSessionById(sessionId, userId);
    if (!session) return null;

    const messages = await sessionRepository.findMessagesBySessionId(sessionId, userId);
    return { session, messages };
  }

  public async createSession(userId: string, title?: string, initialPrompt?: string): Promise<Session> {
    const id = randomUUID();
    const now = new Date().toISOString();

    let sessionTitle = title?.trim();
    if (!sessionTitle && initialPrompt) {
      const words = initialPrompt.trim().split(/\s+/);
      sessionTitle = words.slice(0, 6).join(' ');
      if (words.length > 6) sessionTitle += '...';
    }
    if (!sessionTitle) {
      sessionTitle = `Dự án mới (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    }

    const newSession: Session = {
      id,
      userId,
      title: sessionTitle,
      latestHtml: '',
      versionCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    return sessionRepository.createSession(newSession);
  }

  public async renameSession(userId: string, sessionId: string, newTitle: string): Promise<Session | null> {
    return sessionRepository.updateSession(sessionId, userId, { title: newTitle.trim() });
  }

  public async deleteSession(userId: string, sessionId: string): Promise<boolean> {
    return sessionRepository.deleteSession(sessionId, userId);
  }

  public async saveChatTurn(
    userId: string,
    sessionId: string,
    prompt: string,
    fullAiResponse: string,
    extractedHtml?: string
  ): Promise<{ session: Session; userMsg: SessionMessage; aiMsg: SessionMessage }> {
    let session: Session | null = null;
    if (sessionId && typeof sessionId === 'string' && sessionId.trim()) {
      session = await sessionRepository.findSessionById(sessionId.trim(), userId);
    }

    if (!session) {
      session = await this.createSession(userId, undefined, prompt);
    }

    const now = new Date().toISOString();
    const nextVersionCount = session.versionCount + 1;
    const versionStr = `v1.${nextVersionCount}`;

    const userMsg: SessionMessage = {
      id: randomUUID(),
      sessionId: session.id,
      userId,
      sender: 'user',
      text: prompt,
      createdAt: now,
    };

    const aiMsg: SessionMessage = {
      id: randomUUID(),
      sessionId: session.id,
      userId,
      sender: 'ai',
      text: fullAiResponse,
      extractedHtml: extractedHtml || '',
      version: versionStr,
      createdAt: now,
    };

    await sessionRepository.createMessage(userMsg);
    await sessionRepository.createMessage(aiMsg);

    const updatedSession = await sessionRepository.updateSession(session.id, userId, {
      latestHtml: extractedHtml || session.latestHtml,
      versionCount: nextVersionCount,
      updatedAt: now,
    });

    // Tự động lưu snapshot file HTML vào kho Storage với tên file thực tế AI đã đặt
    if (extractedHtml && extractedHtml.trim()) {
      try {
        let detectedFileName: string | undefined;

        const fileMatch =
          fullAiResponse.match(/`([a-zA-Z0-9_\-]+\.html)`/i) ||
          fullAiResponse.match(/path=["']?([a-zA-Z0-9_\-]+\.html)["']?/i) ||
          fullAiResponse.match(/([C-Z]:\\[^\s"'\n\r<>*?]+\.html)/i) ||
          fullAiResponse.match(/([a-zA-Z0-9_\-]+\.html)/i);

        if (fileMatch && fileMatch[1]) {
          detectedFileName = path.basename(fileMatch[1].trim());
        }

        await storageService.saveHtmlSnapshot(
          userId,
          session.id,
          session.title,
          versionStr,
          extractedHtml,
          detectedFileName
        );
      } catch (storageErr) {
        console.warn('[SessionService] Auto-save storage snapshot error:', storageErr);
      }
    }

    return {
      session: updatedSession || session,
      userMsg,
      aiMsg,
    };
  }
}

export const sessionService = new SessionService();

