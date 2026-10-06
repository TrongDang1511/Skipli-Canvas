import { Request, Response, NextFunction } from 'express';
import { goclawService } from '../services/goclaw.service';
import { ChatStreamDto } from '../dtos/chat.dto';

interface FlushableResponse extends Response {
  flush?: () => void;
}

export class ChatController {
  public streamChat = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { prompt } = req.body as ChatStreamDto;
    const flushableRes = res as FlushableResponse;

    req.socket.setTimeout(0);
    if (res.socket) res.socket.setTimeout(0);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let accumulatedContent = '';
    let isAborted = false;

    req.on('aborted', () => {
      isAborted = true;
    });

    try {
      const stream = await goclawService.streamChatCompletion(prompt);
      let buffer = '';

      stream.on('data', (chunk: Buffer) => {
        if (isAborted) {
          stream.destroy();
          return;
        }

        buffer += chunk.toString('utf-8');
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);
            const deltaToken = parsed.choices?.[0]?.delta?.content || '';

            if (deltaToken) {
              if (
                deltaToken.startsWith('Error:') ||
                deltaToken.includes('failover candidates exhausted') ||
                deltaToken.includes('rate-limited')
              ) {
                res.write(
                  `data: ${JSON.stringify({
                    type: 'error',
                    error: '⚠️ OpenRouter AI Engine đang tạm thời chạm giới hạn lượt gọi miễn phí (Rate Limit). Vui lòng thử lại sau giây lát hoặc gửi lại prompt!',
                  })}\n\n`
                );
                return;
              }

              accumulatedContent += deltaToken;
              res.write(
                `data: ${JSON.stringify({
                  type: 'token',
                  token: deltaToken,
                })}\n\n`
              );
              if (typeof flushableRes.flush === 'function') {
                flushableRes.flush();
              }
            }
          } catch {
            // ignore non-json frames
          }
        }
      });

      stream.on('end', () => {
        if (isAborted) return;

        const extractedHtml = goclawService.extractHtml(accumulatedContent);

        res.write(
          `data: ${JSON.stringify({
            type: 'complete',
            fullContent: accumulatedContent,
            extractedHtml,
          })}\n\n`
        );

        res.write('data: [DONE]\n\n');
        res.end();
      });

      stream.on('error', (err: Error) => {
        if (isAborted) return;
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            error: err.message || 'Lỗi luồng AI Stream',
          })}\n\n`
        );
        res.end();
      });
    } catch (error: unknown) {
      if (!res.headersSent) {
        next(error);
      } else {
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Lỗi kết nối GoClaw AI Engine',
          })}\n\n`
        );
        res.end();
      }
    }
  };
}

export const chatController = new ChatController();
