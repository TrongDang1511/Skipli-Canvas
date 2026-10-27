import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate, optionalAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { authRateLimiter } from '../middlewares/rateLimit.middleware';
import { RegisterSchema, LoginSchema } from '../dtos/auth.dto';

const router = Router();

// Public Auth Endpoints (Validate bằng DTO Schema trước khi vào Controller)
router.post('/register', authRateLimiter, validateBody(RegisterSchema), authController.register);
router.post('/login', authRateLimiter, validateBody(LoginSchema), authController.login);
router.post('/refresh-token', authRateLimiter, authController.refreshToken);

// Protected Auth Endpoints
router.get('/me', authenticate, authController.getMe);
router.post('/logout', optionalAuth, authController.logout);

export default router;
