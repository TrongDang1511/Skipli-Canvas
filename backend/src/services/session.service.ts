import { randomUUID } from 'crypto';
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
    codeUrl?: string;
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
    let codeUrl: string | undefined;

    if (session.s3Key) {
      try {
        const s3Html = await s3Service.getHtmlContent(session.s3Key, session.s3VersionId);
        if (s3Html && s3Html.trim()) {
          latestHtml = s3Html;
        }
      } catch (readErr) {
        console.warn('[SessionService] Error reading latestHtml from S3:', readErr);
      }

      try {
        // Sinh Presigned URL dạng text/plain để AI gọi web_fetch đọc raw code on-demand
        codeUrl = await s3Service.getPresignedRawCodeUrl(session.s3Key, session.s3VersionId);
      } catch (codeUrlErr) {
        console.warn('[SessionService] Error generating rawCodeUrl:', codeUrlErr);
      }
    }

    const messages = await sessionRepository.findMessagesBySessionId(sessionId.trim(), userId);

    // Lấy tối đa 10 tin nhắn gần nhất để AI hiểu trọn vẹn context và lịch sử trò chuyện
    const recentMessages = messages.slice(-10);
    const history = recentMessages.map((msg) => {
      if (msg.sender === 'system') {
        return {
          role: 'user' as const,
          content: `[System Notice: User saved manual edits on the canvas]`,
        };
      }
      return {
        role: (msg.sender === 'ai' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: msg.text || '',
      };
    });

    return {
      session,
      latestHtml,
      codeUrl,
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
      sessionTitle = `New Project (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
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
    if (session) {
      try {
        // Xóa sạch toàn bộ tệp index.html và toàn bộ hình ảnh trong session trên MinIO
        const sessionPrefix = `users/${userId}/sessions/${sessionId}/`;
        await s3Service.deleteObjectsByPrefix(sessionPrefix);
      } catch (s3Err) {
        console.warn('[SessionService] Delete S3 session prefix error:', s3Err);
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
    // hasNewHtml CHỈ true khi thực sự có mã HTML mới khác biệt với bản hiện tại
    let currentHtml = session.latestHtml || '';
    if (!currentHtml && session.s3Key) {
      try {
        currentHtml = await s3Service.getHtmlContent(session.s3Key, session.s3VersionId);
      } catch (err) {
        console.warn('[SessionService] Could not fetch currentHtml from S3:', err);
      }
    }

    const isDifferentHtml = Boolean(
      extractedHtml &&
      extractedHtml.trim() &&
      extractedHtml.trim() !== currentHtml.trim()
    );
    const hasNewHtml = isDifferentHtml;
    const nextVersionCount = hasNewHtml ? session.versionCount + 1 : session.versionCount;
    const versionStr = `v1.${nextVersionCount > 0 ? nextVersionCount : 1}`;

    // Upload mã nguồn HTML lên MinIO/S3 trên 1 file duy nhất index.html và tạo Presigned URL xem Live
    let s3Key: string | undefined;
    let s3VersionId: string | undefined;
    let presignedUrl: string | undefined;
    let presignedExpiresAt: number | undefined;

    if (hasNewHtml && extractedHtml) {
      try {
        s3Key = `users/${userId}/sessions/${session.id}/index.html`;
        const uploadResult = await s3Service.uploadHtml(s3Key, extractedHtml, {
          sessionId: session.id,
          sessionTitle: session.title,
          version: versionStr,
          userId,
          fileName: 'index.html',
        });
        s3VersionId = uploadResult.versionId;

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
      s3VersionId,
      createdAt: now,
    };

    await sessionRepository.createMessage(userMsg);
    await sessionRepository.createMessage(aiMsg);

    const sessionUpdates: Partial<Session> = {
      updatedAt: now,
    };

    if (hasNewHtml) {
      sessionUpdates.versionCount = nextVersionCount;
    }

    if (s3Key) {
      sessionUpdates.s3Key = s3Key;
      sessionUpdates.s3VersionId = s3VersionId;
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
    milestoneMessage?: SessionMessage;
  }> {
    const session = await sessionRepository.findSessionById(sessionId, userId);
    if (!session) {
      throw new Error('Project session not found');
    }

    // Mỗi lần lưu sửa tay sẽ là 1 version mới độc lập (ví dụ: v1.1 -> v1.2), không kèm hậu tố '(Sửa tay)'
    const nextVersionCount = (session.versionCount || 1) + 1;
    const versionStr = `v1.${nextVersionCount}`;
    const s3Key = `users/${userId}/sessions/${session.id}/index.html`;

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
          // Upload ảnh lên thư mục images/ trên MinIO và nhận Static URL vĩnh viễn
          const s3ImageInfo = await s3Service.uploadImageBuffer(
            imageS3Key,
            imageBuffer,
            `image/${ext === 'svg' ? 'svg+xml' : ext}`
          );

          // Thay thế toàn bộ Data URI bằng Public Static URL của ảnh trên MinIO (không có chữ ký tạm thời)
          if (s3ImageInfo.staticUrl) {
            processedHtml = processedHtml.split(fullDataUri).join(s3ImageInfo.staticUrl);
          }
        } catch (imgErr) {
          console.error(`[SessionService] Lỗi khi upload ảnh ${imageFileName} lên MinIO:`, imgErr);
        }
      }
    }

    // 2. Ghi đè file HTML hoàn chỉnh lên MinIO S3 tại index.html và bắt VersionId mới
    const uploadRes = await s3Service.uploadHtml(s3Key, processedHtml, {
      sessionId: session.id,
      sessionTitle: session.title,
      version: versionStr,
      userId,
      fileName: 'index.html',
    });
    const s3VersionId = uploadRes.versionId;

    // 3. Tái ký Presigned URL mới cho file HTML
    const s3Info = await s3Service.getOrGeneratePresignedViewUrl(s3Key);
    const now = new Date().toISOString();

    // 4. Tạo Tin nhắn mốc hệ thống vào Firestore
    const milestoneMessage: SessionMessage = {
      id: randomUUID(),
      sessionId: session.id,
      userId,
      sender: 'system',
      eventType: 'manual_edit',
      text: 'You saved manual edits on the canvas',
      version: versionStr,
      s3VersionId,
      createdAt: now,
    };
    await sessionRepository.createMessage(milestoneMessage);

    // 5. Cập nhật Firestore Session (Cập nhật versionCount mới)
    await sessionRepository.updateSession(session.id, userId, {
      s3Key,
      s3VersionId,
      latestHtml: '',
      presignedUrl: s3Info.presignedUrl,
      presignedExpiresAt: s3Info.presignedExpiresAt,
      versionCount: nextVersionCount,
      updatedAt: now,
    });

    // 6. Tự động dọn dẹp các ảnh cũ đã bị thay thế hoặc xóa bỏ khỏi HTML trên MinIO
    try {
      await s3Service.cleanupUnreferencedSessionImages(userId, session.id, processedHtml);
    } catch (cleanupErr) {
      console.warn('[SessionService] Cleanup unreferenced images error:', cleanupErr);
    }

    return {
      success: true,
      sessionId: session.id,
      presignedUrl: s3Info.presignedUrl,
      cleanHtml: processedHtml,
      updatedAt: now,
      milestoneMessage,
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
    userMessageId: string,
    promptTextFallback?: string
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
      throw new Error('Project session not found');
    }

    const messages = await sessionRepository.findMessagesBySessionId(sessionId, userId);
    let targetIndex = messages.findIndex((m) => m.id === userMessageId);

    // Fallback 1: Nếu không tìm thấy theo ID, tìm theo promptTextFallback
    if (targetIndex === -1 && promptTextFallback && promptTextFallback.trim()) {
      const cleanPrompt = promptTextFallback.trim();
      targetIndex = messages.findIndex(
        (m) => m.sender === 'user' && m.text && m.text.trim() === cleanPrompt
      );
    }

    // Fallback 2: Nếu userMessageId là client ID tạm thời (user-...) mà không khớp ID, tìm tin nhắn user gần nhất
    if (targetIndex === -1 && typeof userMessageId === 'string' && userMessageId.startsWith('user-')) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].sender === 'user') {
          targetIndex = i;
          break;
        }
      }
    }

    if (targetIndex === -1) {
      throw new Error('Target message for rollback not found');
    }

    const targetUserMessage = messages[targetIndex];
    if (targetUserMessage.sender !== 'user') {
      throw new Error('Rollback is only supported from user messages');
    }

    const promptText = targetUserMessage.text || '';
    const keepMessages = messages.slice(0, targetIndex);
    const deleteMessages = messages.slice(targetIndex);

    // 1. Xác định Target Version cần khôi phục (Tìm ngược trong keepMessages xem có message nào có s3VersionId)
    const lastCodeMsg = [...keepMessages].reverse().find((m) => m.s3VersionId);
    let restoredVersion = 'v1.0';
    let restoredVersionNumber = 0;
    let restoredVersionId: string | undefined = undefined;
    const s3Key = session.s3Key || `users/${userId}/sessions/${session.id}/index.html`;
    let restoredPresignedUrl = '';
    let restoredPresignedExpiresAt: number | undefined = undefined;
    let restoredHtml = '';

    if (lastCodeMsg && lastCodeMsg.s3VersionId) {
      restoredVersion = lastCodeMsg.version || 'v1.1';
      restoredVersionId = lastCodeMsg.s3VersionId;
      const parsedNum = parseInt(restoredVersion.replace(/^v1\./, '').replace(/[^0-9]/g, ''), 10);
      restoredVersionNumber = isNaN(parsedNum) ? 1 : parsedNum;

      try {
        const s3Info = await s3Service.getOrGeneratePresignedViewUrl(s3Key, undefined, undefined, restoredVersionId);
        restoredPresignedUrl = s3Info.presignedUrl;
        restoredPresignedExpiresAt = s3Info.presignedExpiresAt;
        restoredHtml = await s3Service.getHtmlContent(s3Key, restoredVersionId);
      } catch (s3Err) {
        console.warn('[SessionService] Lỗi khi nạp lại phiên bản đích từ S3:', s3Err);
      }
    }

    // 2. Dọn dẹp các VersionId của các lượt bị hủy trên MinIO S3 (Garbage Collection)
    let deletedFilesCount = 0;
    for (const msg of deleteMessages) {
      if (msg.s3VersionId) {
        try {
          await s3Service.deleteObjectVersion(s3Key, msg.s3VersionId);
          deletedFilesCount++;
        } catch (delErr) {
          console.warn(`[SessionService] Lỗi khi xóa version ${msg.s3VersionId} trên MinIO:`, delErr);
        }
      }
    }

    // 3. Xóa các message phía sau trong Firestore / Memory
    const messageIdsToDelete = deleteMessages.map((m) => m.id);
    await sessionRepository.deleteMessagesByIds(session.id, userId, messageIdsToDelete);

    // 4. Cập nhật Session
    const now = new Date().toISOString();
    await sessionRepository.updateSession(session.id, userId, {
      s3Key,
      s3VersionId: restoredVersionId || '',
      latestHtml: '',
      presignedUrl: restoredPresignedUrl,
      presignedExpiresAt: restoredPresignedExpiresAt,
      versionCount: restoredVersionNumber,
      updatedAt: now,
    });

    // Tự động dọn dẹp các ảnh mồ côi thuộc các version bị rollback trên MinIO
    try {
      await s3Service.cleanupUnreferencedSessionImages(userId, session.id, restoredHtml);
    } catch (cleanupErr) {
      console.warn('[SessionService] Cleanup unreferenced images on user turn rollback error:', cleanupErr);
    }

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

  /**
   * Quản lý phiên bản: Khôi phục về mốc Chỉnh sửa thủ công (Cách B).
   * - Giữ lại thẻ mốc sửa tay này trong Firestore.
   * - Xóa toàn bộ các lượt chat AI/User phát sinh sau mốc này.
   * - Xóa các S3 VersionIds phát sinh sau mốc này.
   * - Khôi phục Canvas về đúng s3VersionId của mốc sửa tay này.
   */
  public async rollbackToMilestone(
    userId: string,
    sessionId: string,
    milestoneMessageId: string
  ): Promise<{
    success: boolean;
    sessionId: string;
    restoredVersion: string;
    restoredPresignedUrl: string;
    restoredHtml: string;
    deletedMessagesCount: number;
    deletedFilesCount: number;
  }> {
    const session = await sessionRepository.findSessionById(sessionId, userId);
    if (!session) {
      throw new Error('Project session not found');
    }

    const messages = await sessionRepository.findMessagesBySessionId(sessionId, userId);
    const targetIndex = messages.findIndex((m) => m.id === milestoneMessageId);

    if (targetIndex === -1) {
      throw new Error('Manual edit milestone not found');
    }

    const targetMilestone = messages[targetIndex];
    if (targetMilestone.sender !== 'system' || targetMilestone.eventType !== 'manual_edit') {
      throw new Error('Rollback is only supported for manual edit milestones');
    }

    if (!targetMilestone.s3VersionId) {
      throw new Error('Milestone does not contain a valid version snapshot');
    }

    // 1. Phân chia message: GIỮ LẠI cả mốc sửa tay này (từ đầu đến targetIndex)
    const deleteMessages = messages.slice(targetIndex + 1);

    // 2. Dọn dẹp các VersionId S3 phát sinh sau mốc này
    let deletedFilesCount = 0;
    const s3Key = session.s3Key || `users/${userId}/sessions/${session.id}/index.html`;

    for (const msg of deleteMessages) {
      if (msg.s3VersionId) {
        try {
          await s3Service.deleteObjectVersion(s3Key, msg.s3VersionId);
          deletedFilesCount++;
        } catch (delErr) {
          console.warn(`[SessionService] Lỗi khi xóa version ${msg.s3VersionId} sau mốc sửa tay:`, delErr);
        }
      }
    }

    // 3. Khôi phục Canvas về đúng s3VersionId của mốc sửa tay này
    const restoredVersionId = targetMilestone.s3VersionId;
    const restoredVersion = targetMilestone.version || 'v1.X (Manual Edit)';
    let restoredPresignedUrl = '';
    let restoredPresignedExpiresAt: number | undefined = undefined;
    let restoredHtml = '';

    try {
      const s3Info = await s3Service.getOrGeneratePresignedViewUrl(s3Key, undefined, undefined, restoredVersionId);
      restoredPresignedUrl = s3Info.presignedUrl;
      restoredPresignedExpiresAt = s3Info.presignedExpiresAt;
      restoredHtml = await s3Service.getHtmlContent(s3Key, restoredVersionId);
    } catch (s3Err) {
      console.warn('[SessionService] Lỗi khi nạp lại mã HTML của mốc sửa tay:', s3Err);
    }

    // 4. Xóa các message phía sau trong Firestore
    if (deleteMessages.length > 0) {
      const messageIdsToDelete = deleteMessages.map((m) => m.id);
      await sessionRepository.deleteMessagesByIds(session.id, userId, messageIdsToDelete);
    }

    // 5. Cập nhật Session
    const parsedNum = parseInt(restoredVersion.replace(/^v1\./, '').replace(/[^0-9]/g, ''), 10);
    const restoredVersionNumber = isNaN(parsedNum) ? (session.versionCount || 1) : parsedNum;

    const now = new Date().toISOString();
    await sessionRepository.updateSession(session.id, userId, {
      s3Key,
      s3VersionId: restoredVersionId,
      latestHtml: '',
      presignedUrl: restoredPresignedUrl,
      presignedExpiresAt: restoredPresignedExpiresAt,
      versionCount: restoredVersionNumber,
      updatedAt: now,
    });

    // Tự động dọn dẹp các ảnh mồ côi thuộc các mốc bị rollback trên MinIO
    try {
      await s3Service.cleanupUnreferencedSessionImages(userId, session.id, restoredHtml);
    } catch (cleanupErr) {
      console.warn('[SessionService] Cleanup unreferenced images on milestone rollback error:', cleanupErr);
    }

    return {
      success: true,
      sessionId: session.id,
      restoredVersion,
      restoredPresignedUrl,
      restoredHtml,
      deletedMessagesCount: deleteMessages.length,
      deletedFilesCount,
    };
  }
}

export const sessionService = new SessionService();


