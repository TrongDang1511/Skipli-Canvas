import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../types/auth.types';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Dữ liệu req.body đã được validateBody(RegisterSchema) kiểm tra sạch 100% trước khi tới đây
      const result = await authService.register(req.body);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Dữ liệu req.body đã được validateBody(LoginSchema) kiểm tra sạch 100%
      const result = await authService.login(req.body);

      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Dữ liệu req.body đã được validateBody(RefreshTokenSchema) kiểm tra sạch 100%
      const { refreshToken } = req.body;
      const tokens = await authService.refreshTokens(refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.id) {
        await authService.logout(req.user.id);
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const userProfile = await authService.getUserProfile(req.user.id);

      res.json({
        success: true,
        data: userProfile
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
