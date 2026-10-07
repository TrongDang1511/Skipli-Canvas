import { Request, Response, NextFunction } from 'express';
import { storageService } from '../services/storage.service';

export class StorageController {
  public getFiles = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
      return;
    }

    try {
      const files = await storageService.getUserStorageFiles(userId);
      res.status(200).json({
        success: true,
        data: files,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  public downloadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
      return;
    }

    try {
      const file = await storageService.getFileForDownload(userId, id);
      if (!file) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy tệp lưu trữ trong kho',
        });
        return;
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
      res.status(200).send(file.htmlContent);
    } catch (error: unknown) {
      next(error);
    }
  };

  public deleteFile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
      return;
    }

    try {
      const deleted = await storageService.deleteStorageFile(userId, id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'Tệp không tồn tại hoặc bạn không có quyền xóa',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Đã xóa tệp khỏi kho lưu trữ thành công',
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}

export const storageController = new StorageController();
