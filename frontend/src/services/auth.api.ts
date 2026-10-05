import { apiClient } from './api';
import { ApiResponse, AuthResponseData, User } from '../types/auth';

export async function registerApi(data: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<AuthResponseData> {
  const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/register', data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Registration failed');
  }
  return response.data.data;
}

export async function loginApi(data: {
  email: string;
  password: string;
}): Promise<AuthResponseData> {
  const response = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', data);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Login failed');
  }
  return response.data.data;
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
