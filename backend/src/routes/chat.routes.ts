import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { chatStreamSchema } from '../dtos/chat.dto';

const router = Router();

/**
 * @route   POST /api/chat/stream
 * @desc    Gửi prompt và nhận luồng dữ liệu SSE từ GoClaw AI Engine
 * @access  Private (Yêu cầu Bearer Access Token)
 */
router.post(
  '/stream',
  authenticate,
  validateBody(chatStreamSchema),
  chatController.streamChat
);

export default router;
