import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '../config/env.config';

function createLimiter(windowMs: number, max: number, message: string, skipFn?: (req: Request) => boolean) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: skipFn,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: message,
      });
    },
  });
}

export const globalRateLimiter = createLimiter(
  env.rateLimitGlobalWindowMs,
  env.rateLimitGlobalMax,
  'Too many requests from this IP address. Please try again later.',
  (req: Request) => req.path === '/health'
);

export const authRateLimiter = createLimiter(
  env.rateLimitAuthWindowMs,
  env.rateLimitAuthMax,
  'Too many authentication attempts. Please try again after 15 minutes.'
);

export const aiRateLimiter = createLimiter(
  env.rateLimitAiWindowMs,
  env.rateLimitAiMax,
  'AI generation rate limit exceeded. Please wait a moment before trying again.'
);
