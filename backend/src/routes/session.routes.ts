import { Router } from 'express';
import { sessionController } from '../controllers/session.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createSessionSchema, updateSessionSchema } from '../dtos/session.dto';

const router = Router();

router.use(authenticate);

router.get('/', sessionController.getSessions);
router.post('/', validateBody(createSessionSchema), sessionController.createSession);
router.get('/:id', sessionController.getSessionDetail);
router.patch('/:id', validateBody(updateSessionSchema), sessionController.renameSession);
router.delete('/:id', sessionController.deleteSession);

export default router;
