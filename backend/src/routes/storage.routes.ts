import { Router } from 'express';
import { storageController } from '../controllers/storage.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   GET /api/storage/files
 * @desc    Lấy danh sách các tệp HTML snapshot của người dùng
 * @access  Private
 */
router.get('/files', authenticate, storageController.getFiles);

/**
 * @route   GET /api/storage/files/:id/download
 * @desc    Tải tệp HTML đính kèm về máy
 * @access  Private
 */
router.get('/files/:id/download', authenticate, storageController.downloadFile);

/**
 * @route   DELETE /api/storage/files/:id
 * @desc    Xóa tệp khỏi kho lưu trữ
 * @access  Private
 */
router.delete('/files/:id', authenticate, storageController.deleteFile);

export default router;
