import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, LoginResponseData } from '../types/auth';
import {
  loginApi,
  verifyLoginOtpApi,
  resendLoginOtpApi,
  requestRegisterOtpApi,
  verifyRegisterOtpApi,
  setCredentialsApi,
  logoutApi,
  getMeApi,
  refreshTokenApi
} from '../services/auth.api';
import { STORAGE_KEYS } from '../config/env.config';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<LoginResponseData>;
  verifyLoginOtp: (email: string, otp: string) => Promise<void>;
  resendLoginOtp: (email: string) => Promise<void>;
  requestRegisterOtp: (email: string) => Promise<{ email: string }>;
  verifyRegisterOtp: (email: string, otp: string) => Promise<{ isProfileComplete: boolean }>;
  setCredentials: (displayName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUserDisplayName: (newDisplayName: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const extractErrorMessage = (err: unknown, fallback: string): string => {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
      return axiosErr.response?.data?.error || axiosErr.response?.data?.message || fallback;
    }
    return err instanceof Error ? err.message : fallback;
  };

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (!accessToken) {
        try {
          const refreshData = await refreshTokenApi();
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, refreshData.accessToken);
          const userProfile = await getMeApi();
          setUser(userProfile);
        } catch {
          setUser(null);
        } finally {
          setIsInitializing(false);
        }
        return;
      }

      try {
        const userProfile = await getMeApi();
        setUser(userProfile);
      } catch {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Đăng nhập Bước 1: Gửi credentials -> Nhận yêu cầu nhập 2FA OTP
   */
  const login = async (email: string, password: string): Promise<LoginResponseData> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loginApi({ email, password });
      return result;
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, 'Sign in failed');
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Đăng nhập Bước 2: Xác nhận OTP 2FA -> Hoàn tất phiên và cấp Token
   */
  const verifyLoginOtp = async (email: string, otp: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const authData = await verifyLoginOtpApi({ email, otp });
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken);
      setUser(authData.user);
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, 'Invalid login verification code');
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const resendLoginOtp = async (email: string): Promise<void> => {
    setError(null);
    try {
      await resendLoginOtpApi(email);
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, 'Failed to resend login code');
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  /**
   * Đăng ký Bước 1: Nhập email -> Nhận mã OTP kích hoạt
   */
  const requestRegisterOtp = async (email: string): Promise<{ email: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await requestRegisterOtpApi(email);
      return { email: res.email };
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, 'Failed to request registration code');
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Đăng ký Bước 2: Nhập OTP -> Xác thực -> Tạo User trong DB -> Cấp Token
   */
  const verifyRegisterOtp = async (email: string, otp: string): Promise<{ isProfileComplete: boolean }> => {
    setIsLoading(true);
    setError(null);
    try {
      const authData = await verifyRegisterOtpApi({ email, otp });
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken);
      setUser(authData.user);
      return { isProfileComplete: !!authData.isProfileComplete };
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, 'Invalid registration verification code');
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Đăng ký Bước 3: Thiết lập Tên hiển thị và Mật khẩu hoàn tất
   */
  const setCredentials = async (displayName: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await setCredentialsApi({ displayName, password });
      setUser(updatedUser);
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err, 'Failed to complete profile setup');
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutApi();
    } finally {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      setUser(null);
      setIsLoading(false);
    }
  };

  const updateUserDisplayName = useCallback((newDisplayName: string) => {
    setUser((prev) => (prev ? { ...prev, displayName: newDisplayName } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isInitializing,
        error,
        login,
        verifyLoginOtp,
        resendLoginOtp,
        requestRegisterOtp,
        verifyRegisterOtp,
        setCredentials,
        logout,
        clearError,
        updateUserDisplayName
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
