import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types/auth';
import { loginApi, registerApi, logoutApi, getMeApi } from '../services/auth.api';
import { STORAGE_KEYS } from '../config/env.config';

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

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userProfile = await getMeApi();
        setUser(userProfile);
      } catch {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
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
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken);
      setUser(authData.user);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Đăng nhập không thành công'
          : err instanceof Error
          ? err.message
          : 'Đăng nhập không thành công';
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
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken);
      setUser(authData.user);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Đăng ký không thành công'
          : err instanceof Error
          ? err.message
          : 'Đăng ký không thành công';
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
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
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
