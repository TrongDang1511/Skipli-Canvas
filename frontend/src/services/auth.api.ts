import { apiClient } from './api';
import { ApiResponse, AuthResponseData, LoginResponseData, User } from '../types/auth';

/**
 * Bước 1 Register: Gửi email yêu cầu nhận mã OTP kích hoạt
 */
export async function requestRegisterOtpApi(email: string): Promise<{ message: string; email: string }> {
  const response = await apiClient.post<ApiResponse<{ email: string }>>('/auth/register/request-otp', { email });
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to send registration verification code');
  }
  return {
    message: response.data.message || 'Verification code sent to your email',
    email: response.data.data.email
  };
}

/**
 * Bước 2 Register: Nhập OTP -> Xác thực -> Tạo User trong DB -> Cấp Token
 */
export async function verifyRegisterOtpApi(data: {
  email: string;
  otp: string;
}): Promise<AuthResponseData & { isProfileComplete: boolean }> {
  const response = await apiClient.post<ApiResponse<AuthResponseData & { isProfileComplete: boolean }>>(
    '/auth/register/verify-otp',
    data
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Invalid verification code');
  }
  return response.data.data;
}

/**
 * Bước 3 Register: Chuyển hướng sang nhập Tên hiển thị và Mật khẩu hoàn tất
 */
export async function setCredentialsApi(data: {
  displayName: string;
  password: string;
}): Promise<User> {
  const response = await apiClient.post<ApiResponse<User>>('/auth/register/set-credentials', data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to set account profile and password');
  }
  return response.data.data;
}

/**
 * Bước 1 Login: Gửi Email & Password -> Nhận yêu cầu xác thực 2FA OTP
 */
export async function loginApi(data: {
  email: string;
  password: string;
}): Promise<LoginResponseData> {
  const response = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Sign in failed');
  }
  return response.data.data;
}

/**
 * Bước 2 Login: Nhập 6 số OTP 2FA -> Xác thực -> Hoàn tất đăng nhập & Nhận Access Token
 */
export async function verifyLoginOtpApi(data: {
  email: string;
  otp: string;
}): Promise<AuthResponseData> {
  const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/verify-login-otp', data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Invalid login verification code');
  }
  return response.data.data;
}

/**
 * Gửi lại mã Login 2FA OTP
 */
export async function resendLoginOtpApi(email: string): Promise<string> {
  const response = await apiClient.post<ApiResponse<void>>('/auth/resend-login-otp', { email });
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to resend login code');
  }
  return response.data.message || 'Login code resent successfully.';
}

export async function getMeApi(): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>('/auth/me');
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch user profile');
  }
  return response.data.data;
}

export async function logoutApi(): Promise<void> {
  try {
    await apiClient.post<ApiResponse>('/auth/logout');
  } catch (error) {
    // Ignore error on logout endpoint and clear local storage anyway
  }
}

export async function refreshTokenApi(): Promise<{ accessToken: string }> {
  const response = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh-token', {});
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to refresh token');
  }
  return response.data.data;
}

export async function forgotPasswordApi(email: string): Promise<string> {
  const response = await apiClient.post<ApiResponse<void>>('/auth/forgot-password', { email });
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to process password reset request');
  }
  return response.data.message || 'If your email is registered, you will receive a reset link shortly.';
}

export async function resetPasswordApi(data: { token: string; newPassword: string }): Promise<string> {
  const response = await apiClient.post<ApiResponse<void>>('/auth/reset-password', data);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to reset password');
  }
  return response.data.message || 'Password has been reset successfully.';
}

export async function updateProfileApi(data: { displayName: string }): Promise<User> {
  const response = await apiClient.put<ApiResponse<User>>('/auth/profile', data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to update profile');
  }
  return response.data.data;
}

export async function requestPasswordOtpApi(): Promise<string> {
  const response = await apiClient.post<ApiResponse<void>>('/auth/password-otp/request');
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to send verification code');
  }
  return response.data.message || 'Verification code has been sent to your email.';
}

export async function verifyOtpAndChangePasswordApi(data: {
  otp: string;
  newPassword: string;
}): Promise<string> {
  const response = await apiClient.post<ApiResponse<void>>('/auth/password-otp/verify-and-change', data);
  if (!response.data.success) {
    throw new Error(response.data.error || 'Failed to change password');
  }
  return response.data.message || 'Password changed successfully.';
}
