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

    let latestHtml = session.latestHtml || '';
    if (session.s3Key) {
      try {
        const s3Html = await s3Service.getHtmlContent(session.s3Key);
        if (s3Html && s3Html.trim()) {
          latestHtml = s3Html;
        }
      } catch (readErr) {
        console.warn('[SessionService] Error reading latestHtml from S3:', readErr);
      }
    }

    const messages = await sessionRepository.findMessagesBySessionId(sessionId.trim(), userId);

    // Lấy tối đa 10 tin nhắn gần nhất để AI hiểu trọn vẹn context và lịch sử trò chuyện
    const recentMessages = messages.slice(-10);
    const history = recentMessages.map((msg) => ({
      role: (msg.sender === 'ai' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: msg.text || '',
    }));

    return {
      session,
      latestHtml,
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

    const sessionUpdates: Partial<Session> = {
      versionCount: nextVersionCount,
      updatedAt: now,
    };

    if (s3Key) {
      sessionUpdates.s3Key = s3Key;
      sessionUpdates.latestHtml = '';
    } else if (extractedHtml) {
      sessionUpdates.latestHtml = extractedHtml;
    }

    if (presignedUrl) {
      sessionUpdates.presignedUrl = presignedUrl;
    }
    if (presignedExpiresAt) {
      sessionUpdates.presignedExpiresAt = presignedExpiresAt;
    }

    const updatedSession = await sessionRepository.updateSession(session.id, userId, sessionUpdates);

    return {
      session: updatedSession || session,
      userMsg,
      aiMsg,
    };
  }

  /**
   * Giai đoạn 5: Ghi đè HTML chỉnh sửa tay lên MinIO S3.
   * Tự động quét và bóc tách các ảnh người dùng tải từ máy tính (Base64 Data URI),
   * upload lên thư mục MinIO "users/{userId}/sessions/{sessionId}/images/{fileName}",
   * thay thế src ảnh trong HTML bằng Presigned URL mới và ghi đè HTML lên MinIO S3.
   */
  public async overwriteCanvas(
    userId: string,
    sessionId: string,
    cleanHtml: string
  ): Promise<{
    success: boolean;
    sessionId: string;
    presignedUrl: string;
    cleanHtml: string;
    updatedAt: string;
  }> {
    const session = await sessionRepository.findSessionById(sessionId, userId);
    if (!session) {
      throw new Error(`Không tìm thấy phiên làm việc với mã: ${sessionId}`);
    }

    const versionStr = session.versionCount > 0 ? `v1.${session.versionCount}` : 'v1.1';
    const s3Key = session.s3Key || `users/${userId}/sessions/${session.id}/${versionStr}.html`;

    // 1. Quét tìm và bóc tách các ảnh Base64 Data URI được upload từ máy tính
    let processedHtml = cleanHtml;
    const base64Regex = /data:image\/([a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=]+)/g;
    const matches = Array.from(cleanHtml.matchAll(base64Regex));

    if (matches.length > 0) {
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const fullDataUri = match[0];
        const rawMime = match[1].toLowerCase();
        let ext = 'png';
        if (rawMime.includes('svg')) ext = 'svg';
        else if (rawMime.includes('jpeg') || rawMime.includes('jpg')) ext = 'jpg';
        else if (rawMime.includes('webp')) ext = 'webp';
        else if (rawMime.includes('gif')) ext = 'gif';

        const base64Content = match[2];
        const imageBuffer = Buffer.from(base64Content, 'base64');
        const imageFileName = `img_${Date.now()}_${i + 1}.${ext}`;
        const imageS3Key = `users/${userId}/sessions/${session.id}/images/${imageFileName}`;

        try {
          // Upload ảnh lên thư mục images/ trên MinIO
          const s3ImageInfo = await s3Service.uploadImageBuffer(
            imageS3Key,
            imageBuffer,
            `image/${ext === 'svg' ? 'svg+xml' : ext}`
          );

          // Thay thế toàn bộ Data URI bằng Presigned URL của ảnh trên MinIO
          if (s3ImageInfo.presignedUrl) {
            processedHtml = processedHtml.split(fullDataUri).join(s3ImageInfo.presignedUrl);
          }
        } catch (imgErr) {
          console.error(`[SessionService] Lỗi khi upload ảnh ${imageFileName} lên MinIO:`, imgErr);
        }
      }
    }

    // 2. Ghi đè file HTML hoàn chỉnh lên MinIO S3 tại đúng s3Key hiện tại
    await s3Service.uploadHtml(s3Key, processedHtml, {
      sessionId: session.id,
      sessionTitle: session.title,
      version: versionStr,
      userId,
      fileName: `website_${versionStr}.html`,
    });

    // 3. Tái ký Presigned URL mới cho file HTML
    const s3Info = await s3Service.getOrGeneratePresignedViewUrl(s3Key);
    const now = new Date().toISOString();

    // 4. Cập nhật Firestore
    await sessionRepository.updateSession(session.id, userId, {
      s3Key,
      latestHtml: '',
      presignedUrl: s3Info.presignedUrl,
      presignedExpiresAt: s3Info.presignedExpiresAt,
      updatedAt: now,
    });

    return {
      success: true,
      sessionId: session.id,
      presignedUrl: s3Info.presignedUrl,
      cleanHtml: processedHtml,
      updatedAt: now,
    };
  }

  /**
   * Quản lý phiên bản: Khôi phục về trước một lượt chat của User (Rollback / Rewind).
   * - Xác định phiên bản đích là lượt AI liền kề trước đó (hoặc trạng thái rỗng nếu ở turn 1).
   * - Dọn dẹp sạch sẽ các tệp HTML (v1.X.html) của các version bị hủy trên MinIO S3.
   * - Xóa các lượt chat sau bước này trong Firestore.
   * - Cập nhật Session và trả về presignedUrl mới cùng promptText cũ để Frontend prefill vào ô input.
   */
  public async rollbackToUserTurn(
    userId: string,
    sessionId: string,
    userMessageId: string
  ): Promise<{
    success: boolean;
    sessionId: string;
    restoredVersion: string;
    restoredPresignedUrl: string;
    restoredHtml: string;
    promptText: string;
    deletedMessagesCount: number;
    deletedFilesCount: number;
  }> {
    const session = await sessionRepository.findSessionById(sessionId, userId);
    if (!session) {
      throw new Error(`Không tìm thấy phiên làm việc với mã: ${sessionId}`);
    }

    const messages = await sessionRepository.findMessagesBySessionId(sessionId, userId);
    const targetIndex = messages.findIndex((m) => m.id === userMessageId);

    if (targetIndex === -1) {
      throw new Error(`Không tìm thấy tin nhắn yêu cầu khôi phục với mã: ${userMessageId}`);
    }

    const targetUserMessage = messages[targetIndex];
    if (targetUserMessage.sender !== 'user') {
      throw new Error('Chỉ hỗ trợ khôi phục từ tin nhắn của người dùng.');
    }

    const promptText = targetUserMessage.text || '';
    const keepMessages = messages.slice(0, targetIndex);
    const deleteMessages = messages.slice(targetIndex);

    // 1. Xác định Target Version cần khôi phục
    const lastAiMsg = keepMessages.filter((m) => m.sender === 'ai').pop();
    let restoredVersion = 'v1.0';
    let restoredVersionNumber = 0;
    let restoredS3Key: string | undefined = undefined;
    let restoredPresignedUrl = '';
    let restoredPresignedExpiresAt: number | undefined = undefined;
    let restoredHtml = '';

    if (lastAiMsg && lastAiMsg.version) {
      restoredVersion = lastAiMsg.version;
      const parsedNum = parseInt(restoredVersion.replace(/^v1\./, ''), 10);
      restoredVersionNumber = isNaN(parsedNum) ? 1 : parsedNum;
      restoredS3Key = `users/${userId}/sessions/${session.id}/${restoredVersion}.html`;

      try {
        const s3Info = await s3Service.getOrGeneratePresignedViewUrl(restoredS3Key);
        restoredPresignedUrl = s3Info.presignedUrl;
        restoredPresignedExpiresAt = s3Info.presignedExpiresAt;
        restoredHtml = await s3Service.getHtmlContent(restoredS3Key);
      } catch (s3Err) {
        console.warn('[SessionService] Lỗi khi nạp lại phiên bản đích từ S3:', s3Err);
      }
    }

    // 2. Dọn dẹp các file HTML của các version bị hủy trên MinIO S3
    let deletedFilesCount = 0;
    const deletedAiMessages = deleteMessages.filter((m) => m.sender === 'ai' && m.version);

    for (const msg of deletedAiMessages) {
      if (msg.version) {
        const s3KeyToDelete = `users/${userId}/sessions/${session.id}/${msg.version}.html`;
        try {
          await s3Service.deleteObject(s3KeyToDelete);
          deletedFilesCount++;
        } catch (delErr) {
          console.warn(`[SessionService] Lỗi khi xóa file ${s3KeyToDelete} trên MinIO:`, delErr);
        }
      }
    }

    // 3. Xóa các message phía sau trong Firestore / Memory
    const messageIdsToDelete = deleteMessages.map((m) => m.id);
    await sessionRepository.deleteMessagesByIds(session.id, userId, messageIdsToDelete);

    // 4. Cập nhật Session
    const now = new Date().toISOString();
    await sessionRepository.updateSession(session.id, userId, {
      s3Key: restoredS3Key || '',
      latestHtml: restoredHtml,
      presignedUrl: restoredPresignedUrl,
      presignedExpiresAt: restoredPresignedExpiresAt,
      versionCount: restoredVersionNumber,
      updatedAt: now,
    });

    return {
      success: true,
      sessionId: session.id,
      restoredVersion,
      restoredPresignedUrl,
      restoredHtml,
      promptText,
      deletedMessagesCount: deleteMessages.length,
      deletedFilesCount,
    };
  }
}

export const sessionService = new SessionService();


