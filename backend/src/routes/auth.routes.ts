import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequiredFields } from '../middlewares/validate.middleware';

const router = Router();

// Public Auth Endpoints
router.post('/register', validateRequiredFields(['email', 'password']), authController.register);
router.post('/login', validateRequiredFields(['email', 'password']), authController.login);
router.post('/refresh-token', validateRequiredFields(['refreshToken']), authController.refreshToken);

// Protected Auth Endpoints
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);

export default router;
