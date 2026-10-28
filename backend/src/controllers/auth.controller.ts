import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../types/auth.types';
import { env } from '../config/env.config';

export class AuthController {
  private setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie(env.cookieName, token, {
      httpOnly: true,
      secure: env.cookieSecure,
      sameSite: env.cookieSameSite,
      path: env.cookiePath,
      maxAge: env.cookieMaxAgeMs,
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie(env.cookieName, {
      httpOnly: true,
      secure: env.cookieSecure,
      sameSite: env.cookieSameSite,
      path: env.cookiePath,
    });
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.register(req.body);
      this.setRefreshTokenCookie(res, result.refreshToken);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        }
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.login(req.body);
      this.setRefreshTokenCookie(res, result.refreshToken);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        }
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.[env.cookieName];
      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: 'Refresh token missing or revoked'
        });
        return;
      }

      const tokens = await authService.refreshTokens(refreshToken);
      this.setRefreshTokenCookie(res, tokens.refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: tokens.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      this.clearRefreshTokenCookie(res);

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
  };

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

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await authService.requestPasswordReset(req.body);

      // User Enumeration Defense: always return generic 200 message
      res.json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link shortly.'
      });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await authService.resetPassword(req.body);

      res.json({
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.'
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const updatedProfile = await authService.updateUserProfile(req.user.id, req.body);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  };

  requestPasswordChangeOtp = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      await authService.requestPasswordChangeOtp(req.user.id);

      res.json({
        success: true,
        message: 'Verification code has been sent to your email.'
      });
    } catch (error) {
      next(error);
    }
  };

  changePasswordWithOtp = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      await authService.verifyOtpAndChangePassword(req.user.id, req.body);

      res.json({
        success: true,
        message: 'Password changed successfully. All previous sessions have been signed out.'
      });
    } catch (error) {
      next(error);
    }
  };
}


export const authController = new AuthController();
