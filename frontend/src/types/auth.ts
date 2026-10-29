export interface User {
  id: string;
  email: string;
  displayName: string;
  isEmailVerified?: boolean;
  hasPassword?: boolean;
  createdAt: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface AuthResponseData {
  user: User;
  accessToken: string;
  isProfileComplete?: boolean;
}

export interface LoginResponseData {
  requiresLoginOtp: boolean;
  email: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
