import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware tự động validate và chuẩn hóa Request Body dựa trên Zod Schema của DTO
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse và gán ngược lại dữ liệu đã sanitize (trim, lowercase, etc.) vào req.body
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.issues.map((issue) => issue.message).join(', ');
        res.status(400).json({
          success: false,
          error: errorMessage,
          details: error.issues
        });
        return;
      }
      next(error);
    }
  };
}
