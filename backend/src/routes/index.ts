import { Router } from 'express';
import authRoutes from './auth.routes';
import chatRoutes from './chat.routes';
import sessionRoutes from './session.routes';

const router = Router();

// Mount Auth routes
router.use('/auth', authRoutes);

// Mount Chat / AI Stream routes
router.use('/chat', chatRoutes);

// Mount Session / History routes
router.use('/sessions', sessionRoutes);

export default router;

