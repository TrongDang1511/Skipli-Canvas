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
      const result = await storageService.getFileForDownload(userId, id);
      if (!result || !result.downloadUrl) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy tệp lưu trữ trong hệ thống Cloud',
        });
        return;
      }

      // Trả về JSON chứa S3 Presigned Download URL cho Client tải trực tiếp
      res.status(200).json({
        success: true,
        downloadUrl: result.downloadUrl,
        fileName: result.fileName,
      });
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
        message: 'Đã xóa tệp khỏi hệ thống lưu trữ thành công',
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}

export const storageController = new StorageController();

