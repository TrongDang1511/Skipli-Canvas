export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  [key: string]: any;
}

export interface AuthResponseData {
  user: User;
  accessToken: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
