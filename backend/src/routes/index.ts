import { Router } from 'express';
import authRoutes from './auth.routes';
import chatRoutes from './chat.routes';
import sessionRoutes from './session.routes';
import storageRoutes from './storage.routes';

const router = Router();

// Mount Auth routes
router.use('/auth', authRoutes);

// Mount Chat / AI Stream routes
router.use('/chat', chatRoutes);

// Mount Session / History routes
router.use('/sessions', sessionRoutes);

// Mount Storage / File Download routes
router.use('/storage', storageRoutes);

export default router;


