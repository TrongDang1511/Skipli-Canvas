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
      res.status(401).json({ success: false, message: 'Unauthorized' });
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

  public getGroupedFiles = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    try {
      const grouped = await storageService.getGroupedStorageFiles(userId);
      res.status(200).json({
        success: true,
        data: grouped,
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
    const versionId = typeof req.query.versionId === 'string' ? req.query.versionId : undefined;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    try {
      const result = await storageService.getFileForDownload(userId, id, versionId);
      if (!result || !result.downloadUrl) {
        res.status(404).json({
          success: false,
          message: 'File not found in storage',
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
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    try {
      const deleted = await storageService.deleteStorageFile(userId, id);
      if (!deleted) {
        res.status(404).json({
          success: false,
          message: 'File not found or unauthorized to delete',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'File deleted successfully from storage',
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}

export const storageController = new StorageController();

