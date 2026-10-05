import { z } from 'zod';

/**
 * 1. Register DTO Schema
 * Định nghĩa quy tắc dữ liệu đầu vào khi Đăng ký tài khoản
 */
export const RegisterSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .email('Invalid email address format')
    .trim()
    .toLowerCase(),
  password: z
    .string({ message: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long'),
  displayName: z
    .string()
    .trim()
    .optional()
});

export type RegisterDTO = z.infer<typeof RegisterSchema>;

/**
 * 2. Login DTO Schema
 * Định nghĩa quy tắc dữ liệu đầu vào khi Đăng nhập
 */
export const LoginSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .email('Invalid email address format')
    .trim()
    .toLowerCase(),
  password: z
    .string({ message: 'Password is required' })
    .min(1, 'Password cannot be empty')
});

export type LoginDTO = z.infer<typeof LoginSchema>;

/**
 * 3. Refresh Token DTO Schema
 * Định nghĩa quy tắc dữ liệu đầu vào khi Refresh Token
 */
export const RefreshTokenSchema = z.object({
  refreshToken: z
    .string({ message: 'Refresh token is required' })
    .min(1, 'Refresh token cannot be empty')
    .trim()
});

export type RefreshTokenDTO = z.infer<typeof RefreshTokenSchema>;

/**
 * 4. Response DTOs
 */
export interface UserResponseDTO {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  [key: string]: any;
}

export interface AuthResponseData {
  user: UserResponseDTO;
  accessToken: string;
  refreshToken: string;
}
