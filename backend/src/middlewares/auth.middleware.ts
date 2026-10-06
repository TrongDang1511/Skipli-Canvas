import { Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../types/auth.types';

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Access token missing or invalid format. Expected: Bearer <token>'
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  try {
    const payload = authService.verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid or expired access token';
    res.status(401).json({
      success: false,
      error: message
    });
  }
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    try {
      const payload = authService.verifyAccessToken(token);
      req.user = payload;
    } catch {
      // Ignore invalid token in optional auth
    }
  }

  next();
}
