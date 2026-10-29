export interface User {
  id: string;
  email: string;
  passwordHash?: string | null;
  displayName: string;
  refreshTokenHash?: string | null;
  resetPasswordTokenHash?: string | null;
  resetPasswordExpiresAt?: string | null;
  passwordChangeOtpHash?: string | null;
  passwordChangeOtpExpiresAt?: string | null;

  isEmailVerified?: boolean;
  loginOtpHash?: string | null;
  loginOtpExpiresAt?: string | null;

  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}
