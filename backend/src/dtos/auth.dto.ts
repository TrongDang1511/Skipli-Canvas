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
