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
      const response = await goclawService.chatCompletion(prompt);
      const rawContent = response.text;
      const extractedHtml = goclawService.extractHtml(rawContent);
      const fullContent = goclawService.cleanTextResponse(rawContent);

      let savedSessionId = sessionId;
      let savedVersion = 'v1.1';

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
          extractedHtml,
        },
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}

export const chatController = new ChatController();

