import { randomUUID } from 'crypto';
import path from 'path';
import { Session, SessionMessage } from '../models/session.model';
import { sessionRepository } from '../repositories/session.repository';
import { s3Service } from './s3.service';

export class SessionService {
  public async getUserSessions(userId: string): Promise<Session[]> {
    return sessionRepository.findSessionsByUserId(userId);
  }

  public async getSessionDetail(userId: string, sessionId: string): Promise<{ session: Session; messages: SessionMessage[] } | null> {
    const session = await sessionRepository.findSessionById(sessionId, userId);
    if (!session) return null;

    // Tự động kiểm tra và làm mới Presigned URL nếu hết hạn 4 tiếng
    if (session.s3Key) {
      try {
        const s3Info = await s3Service.getOrGeneratePresignedViewUrl(
          session.s3Key,
          session.presignedUrl,
          session.presignedExpiresAt
        );
        if (s3Info.presignedUrl && s3Info.presignedUrl !== session.presignedUrl) {
          session.presignedUrl = s3Info.presignedUrl;
          session.presignedExpiresAt = s3Info.presignedExpiresAt;
          await sessionRepository.updateSession(session.id, userId, {
            presignedUrl: session.presignedUrl,
            presignedExpiresAt: session.presignedExpiresAt,
          });
        }
      } catch (s3Err) {
        console.warn('[SessionService] Refresh presignedUrl error:', s3Err);
      }
    }

    const messages = await sessionRepository.findMessagesBySessionId(sessionId, userId);
    return { session, messages };
  }

  public async getSessionContext(
    userId: string,
    sessionId: string
  ): Promise<{
    session: Session | null;
    latestHtml: string;
    history: { role: 'user' | 'assistant'; content: string }[];
  }> {
    if (!sessionId || !sessionId.trim()) {
      return { session: null, latestHtml: '', history: [] };
    }

    const session = await sessionRepository.findSessionById(sessionId.trim(), userId);
    if (!session) {
      return { session: null, latestHtml: '', history: [] };
    }

    // Tự động kiểm tra và làm mới Presigned URL nếu hết hạn
    if (session.s3Key) {
      try {
        const s3Info = await s3Service.getOrGeneratePresignedViewUrl(
          session.s3Key,
          session.presignedUrl,
          session.presignedExpiresAt
        );
        if (s3Info.presignedUrl && s3Info.presignedUrl !== session.presignedUrl) {
          session.presignedUrl = s3Info.presignedUrl;
          session.presignedExpiresAt = s3Info.presignedExpiresAt;
          await sessionRepository.updateSession(session.id, userId, {
            presignedUrl: session.presignedUrl,
            presignedExpiresAt: session.presignedExpiresAt,
          });
        }
      } catch (s3Err) {
        console.warn('[SessionService] getSessionContext refresh S3 error:', s3Err);
      }
    }

    const messages = await sessionRepository.findMessagesBySessionId(sessionId.trim(), userId);

    // Lấy tối đa 6 tin nhắn gần nhất để giữ context gọn gàng và chuẩn xác
    const recentMessages = messages.slice(-6);
    const history = recentMessages.map((msg) => ({
      role: (msg.sender === 'ai' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: msg.text || '',
    }));

    return {
      session,
      latestHtml: session.latestHtml || '',
      history,
    };
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
    const session = await sessionRepository.findSessionById(sessionId, userId);
    if (session && session.s3Key) {
      try {
        await s3Service.deleteObject(session.s3Key);
      } catch (s3Err) {
        console.warn('[SessionService] Delete S3 object error:', s3Err);
      }
    }
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

    // Upload mã nguồn HTML lên MinIO/S3 và tạo Presigned URL xem Live
    let s3Key: string | undefined;
    let presignedUrl: string | undefined;
    let presignedExpiresAt: number | undefined;

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

        s3Key = `users/${userId}/sessions/${session.id}/${versionStr}.html`;
        await s3Service.uploadHtml(s3Key, extractedHtml, {
          sessionId: session.id,
          sessionTitle: session.title,
          version: versionStr,
          userId,
          fileName: detectedFileName || `website_${versionStr}.html`,
        });

        const s3Info = await s3Service.getOrGeneratePresignedViewUrl(s3Key);
        presignedUrl = s3Info.presignedUrl;
        presignedExpiresAt = s3Info.presignedExpiresAt;
      } catch (s3Err) {
        console.warn('[SessionService] S3 Upload error:', s3Err);
      }
    }

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
      extractedHtml: s3Key ? '' : (extractedHtml || ''),
      version: versionStr,
      createdAt: now,
    };

    await sessionRepository.createMessage(userMsg);
    await sessionRepository.createMessage(aiMsg);

    const updatedSession = await sessionRepository.updateSession(session.id, userId, {
      latestHtml: s3Key ? '' : (extractedHtml || session.latestHtml),
      s3Key: s3Key || session.s3Key,
      presignedUrl: presignedUrl || session.presignedUrl,
      presignedExpiresAt: presignedExpiresAt || session.presignedExpiresAt,
      versionCount: nextVersionCount,
      updatedAt: now,
    });

    return {
      session: updatedSession || session,
      userMsg,
      aiMsg,
    };
  }
}

export const sessionService = new SessionService();


