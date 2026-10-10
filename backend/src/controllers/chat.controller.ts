import { Request, Response, NextFunction } from 'express';
import { goclawService } from '../services/goclaw.service';
import { sessionService } from '../services/session.service';
import { ChatRequestDto } from '../dtos/chat.dto';

export class ChatController {
  public sendChat = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { prompt, sessionId } = req.body as ChatRequestDto;
    const userId = req.user?.id;

    try {
      let contextOptions: { history?: any[]; currentHtml?: string; sessionTitle?: string } = {};

      if (userId && sessionId && typeof sessionId === 'string' && sessionId.trim()) {
        try {
          const sessionCtx = await sessionService.getSessionContext(userId, sessionId.trim());
          if (sessionCtx) {
            contextOptions = {
              history: sessionCtx.history,
              currentHtml: sessionCtx.latestHtml,
              sessionTitle: sessionCtx.session?.title,
            };
          }
        } catch (ctxErr) {
          console.warn('[ChatController] Failed to fetch session context:', ctxErr);
        }
      }

      const response = await goclawService.chatCompletion(prompt, contextOptions);
      const rawContent = response.text;
      const extractedHtml = goclawService.extractHtml(rawContent);
      const fullContent = goclawService.cleanTextResponse(rawContent);

      let savedSessionId = sessionId;
      let savedVersion = 'v1.1';
      let presignedUrl: string | undefined;

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
          savedVersion = saved.aiMsg.version || 'v1.1';
          presignedUrl = saved.session.presignedUrl;
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
        },
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}

export const chatController = new ChatController();

