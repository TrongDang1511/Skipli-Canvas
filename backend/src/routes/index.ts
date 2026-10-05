import { Router } from 'express';
import authRoutes from './auth.routes';
import chatRoutes from './chat.routes';

const router = Router();

// Mount Auth routes
router.use('/auth', authRoutes);

// Mount Chat / AI Stream routes
router.use('/chat', chatRoutes);

export default router;

