import { Request, Response, NextFunction } from 'express';
import { goclawService, ChatCompletionOptions } from '../services/goclaw.service';
import { sessionService } from '../services/session.service';
import { ChatRequestDto } from '../dtos/chat.dto';
import { unmaskHtmlAssets } from '../utils/asset-masker.utils';
import { Session } from '../models/session.model';

export class ChatController {
  public sendChat = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { prompt, sessionId } = req.body as ChatRequestDto;
    const userId = req.user?.id;
    const requestStartTime = Date.now();

    try {
      let contextOptions: ChatCompletionOptions = {};
      let currentSession: Session | null = null;

      if (userId && sessionId && typeof sessionId === 'string' && sessionId.trim()) {
        try {
          const sessionCtx = await sessionService.getSessionContext(userId, sessionId.trim());
          if (sessionCtx) {
            currentSession = sessionCtx.session;
            contextOptions = {
              history: sessionCtx.history,
              currentHtml: sessionCtx.latestHtml,
              codeUrl: sessionCtx.codeUrl,
              sessionTitle: sessionCtx.session?.title,
            };
          }
        } catch (ctxErr) {
          console.warn('[ChatController] Failed to fetch session context:', ctxErr);
        }
      }

      const response = await goclawService.chatCompletion(prompt, contextOptions);
      const rawContent = response.text;
      let extractedHtml = goclawService.extractHtml(rawContent, requestStartTime);

      // Phục hồi lại toàn bộ link ảnh MinIO S3 / CDN gốc của người dùng từ bảng ánh xạ Token
      if (extractedHtml && response.assetMap && response.assetMap.size > 0) {
        extractedHtml = unmaskHtmlAssets(extractedHtml, response.assetMap);
      }

      const fullContent = goclawService.cleanTextResponse(rawContent);

      let savedSessionId = sessionId;
      let savedVersion = currentSession?.versionCount
        ? `v1.${currentSession.versionCount}`
        : 'v1.1';
      let presignedUrl: string | undefined;
      let userMessageId: string | undefined;
      let aiMessageId: string | undefined;

      if (userId) {
        try {
          const saved = await sessionService.saveChatTurn(
            userId,
            sessionId || '',
            prompt,
            fullContent,
            extractedHtml
          );
          savedSessionId = saved.session.id;
          savedVersion =
            saved.aiMsg.version ||
            (saved.session.versionCount ? `v1.${saved.session.versionCount}` : 'v1.1');
          presignedUrl = saved.session.presignedUrl;
          userMessageId = saved.userMsg?.id;
          aiMessageId = saved.aiMsg?.id;
        } catch (err) {
          console.error('[ChatController] Failed to auto-save chat turn:', err);
        }
      }

      res.status(200).json({
        success: true,
        data: {
          sessionId: savedSessionId,
          version: savedVersion,
          fullContent,
          extractedHtml: '',
          presignedUrl: presignedUrl || '',
          userMessageId: userMessageId || '',
          aiMessageId: aiMessageId || '',
        },
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}

export const chatController = new ChatController();

