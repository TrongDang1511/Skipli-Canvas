import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { chatRequestSchema } from '../dtos/chat.dto';

const router = Router();

/**
 * @route   POST /api/chat
 * @desc    Gửi prompt và nhận phản hồi JSON từ GoClaw AI Engine
 * @access  Private (Yêu cầu Bearer Access Token)
 */
router.post(
  '/',
  authenticate,
  validateBody(chatRequestSchema),
  chatController.sendChat
);

router.post(
  '/stream',
  authenticate,
  validateBody(chatRequestSchema),
  chatController.sendChat
);

export default router;

