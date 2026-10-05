import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types/auth';
import { loginApi, registerApi, logoutApi, getMeApi } from '../services/auth.api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Tải thông tin user từ token lưu sẵn khi mở web
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('skipli_access_token');
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userProfile = await getMeApi();
        setUser(userProfile);
      } catch (err) {
        localStorage.removeItem('skipli_access_token');
        localStorage.removeItem('skipli_refresh_token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const authData = await loginApi({ email, password });
      localStorage.setItem('skipli_access_token', authData.accessToken);
      localStorage.setItem('skipli_refresh_token', authData.refreshToken);
      setUser(authData.user);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Đăng nhập không thành công';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const authData = await registerApi({ email, password, displayName });
      localStorage.setItem('skipli_access_token', authData.accessToken);
      localStorage.setItem('skipli_refresh_token', authData.refreshToken);
      setUser(authData.user);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Đăng ký không thành công';
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
      localStorage.removeItem('skipli_access_token');
      localStorage.removeItem('skipli_refresh_token');
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
