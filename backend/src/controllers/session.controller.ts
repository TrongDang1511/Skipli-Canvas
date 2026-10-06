import { Request, Response, NextFunction } from 'express';
import { sessionService } from '../services/session.service';
import { CreateSessionDto, UpdateSessionDto } from '../dtos/session.dto';

export class SessionController {
  public getSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const sessions = await sessionService.getUserSessions(userId);
      res.status(200).json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  };

  public createSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { title, initialPrompt } = req.body as CreateSessionDto;
      const session = await sessionService.createSession(userId, title, initialPrompt);

      res.status(201).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  };

  public getSessionDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const detail = await sessionService.getSessionDetail(userId, id);
      if (!detail) {
        res.status(404).json({ success: false, message: 'Không tìm thấy phiên hội thoại này' });
        return;
      }

      res.status(200).json({
        success: true,
        data: detail,
      });
    } catch (error) {
      next(error);
    }
  };

  public renameSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { title } = req.body as UpdateSessionDto;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const updated = await sessionService.renameSession(userId, id, title);
      if (!updated) {
        res.status(404).json({ success: false, message: 'Không tìm thấy phiên hội thoại để đổi tên' });
        return;
      }

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const deleted = await sessionService.deleteSession(userId, id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Không tìm thấy phiên hội thoại để xóa' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Đã xóa phiên hội thoại thành công',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const sessionController = new SessionController();
