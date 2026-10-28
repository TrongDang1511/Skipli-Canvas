import { z } from 'zod';

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

export const ForgotPasswordSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .email('Invalid email address format')
    .trim()
    .toLowerCase()
});

export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z
    .string({ message: 'Token is required' })
    .min(1, 'Token cannot be empty')
    .trim(),
  newPassword: z
    .string({ message: 'New password is required' })
    .min(6, 'Password must be at least 6 characters long')
});

export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>;

export const UpdateProfileSchema = z.object({
  displayName: z
    .string({ message: 'Display name is required' })
    .trim()
    .min(1, 'Display name cannot be empty')
    .max(50, 'Display name cannot exceed 50 characters')
});

export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;

export const ChangePasswordWithOtpSchema = z.object({
  otp: z
    .string({ message: 'Verification code is required' })
    .trim()
    .length(6, 'Verification code must be exactly 6 digits'),
  newPassword: z
    .string({ message: 'New password is required' })
    .min(6, 'New password must be at least 6 characters long')
});

export type ChangePasswordWithOtpDTO = z.infer<typeof ChangePasswordWithOtpSchema>;



export interface UserResponseDTO {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponseData {
  user: UserResponseDTO;
  accessToken: string;
}

export interface AuthResultWithTokens {
  user: UserResponseDTO;
  accessToken: string;
  refreshToken: string;
}
