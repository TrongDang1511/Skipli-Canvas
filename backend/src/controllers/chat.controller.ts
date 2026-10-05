import { Request, Response, NextFunction } from 'express';
import { goclawService } from '../services/goclaw.service';
import { ChatStreamDto } from '../dtos/chat.dto';

export class ChatController {
  /**
   * POST /api/chat/stream
   * Khởi tạo luồng Server-Sent Events (SSE) phát token real-time từ GoClaw về client.
   * Controller sạch 100%, dữ liệu đã được validateBody(chatStreamSchema) bảo đảm tính hợp lệ.
   */
  public streamChat = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { prompt } = req.body as ChatStreamDto;

    // Thiết lập HTTP Header chuẩn Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let accumulatedContent = '';
    let isAborted = false;

    // Chỉ ngắt luồng nếu client chủ động gửi tín hiệu abort (hủy stream)
    req.on('aborted', () => {
      isAborted = true;
    });

    try {
      console.log(`[ChatController] Khởi tạo stream với prompt: "${prompt.substring(0, 50)}..."`);
      const stream = await goclawService.streamChatCompletion(prompt);

      let buffer = '';

      stream.on('data', (chunk: Buffer) => {
        if (isAborted) {
          stream.destroy();
          return;
        }

        const chunkStr = chunk.toString('utf-8');
        buffer += chunkStr;
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Giữ lại phần chưa đủ 1 dòng hoàn chỉnh

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(dataStr);
            const deltaToken = parsed.choices?.[0]?.delta?.content || '';

            if (deltaToken) {
              accumulatedContent += deltaToken;
              // Phát token về client
              res.write(
                `data: ${JSON.stringify({
                  type: 'token',
                  token: deltaToken,
                })}\n\n`
              );
              if (typeof (res as any).flush === 'function') {
                (res as any).flush();
              }
            }
          } catch {
            // Bỏ qua nếu dòng data không phải JSON chuẩn
          }
        }
      });

      stream.on('end', () => {
        if (isAborted) return;

        console.log(`[ChatController] Stream hoàn tất, tổng ký tự: ${accumulatedContent.length}`);
        // Trích xuất mã HTML hoàn chỉnh khi kết thúc luồng
        const extractedHtml = goclawService.extractHtml(accumulatedContent);

        // Bắn sự kiện kết thúc kèm mã HTML trích xuất được
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
        console.error('[ChatController] Stream error:', err.message);
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            error: err.message || 'Lỗi luồng AI Stream',
          })}\n\n`
        );
        res.end();
      });
    } catch (error: unknown) {
      console.error('[ChatController] Exception:', error);
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
