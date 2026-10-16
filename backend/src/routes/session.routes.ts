import { Router } from 'express';
import { sessionController } from '../controllers/session.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createSessionSchema, updateSessionSchema, overwriteCanvasSchema, rollbackUserTurnSchema, rollbackMilestoneSchema } from '../dtos/session.dto';

const router = Router();

router.use(authenticate);

router.get('/', sessionController.getSessions);
router.post('/', validateBody(createSessionSchema), sessionController.createSession);
router.get('/:id', sessionController.getSessionDetail);
router.patch('/:id', validateBody(updateSessionSchema), sessionController.renameSession);
router.delete('/:id', sessionController.deleteSession);
router.put('/:id/overwrite-canvas', validateBody(overwriteCanvasSchema), sessionController.overwriteCanvas);
router.post('/:id/rollback-user-turn', validateBody(rollbackUserTurnSchema), sessionController.rollbackUserTurn);
router.post('/:id/rollback-milestone', validateBody(rollbackMilestoneSchema), sessionController.rollbackMilestone);

export default router;
