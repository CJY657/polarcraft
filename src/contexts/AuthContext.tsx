/**
 * Authentication Context
 * 认证上下文
 *
 * Provides authentication state and methods throughout the app
 * 在整个应用中提供认证状态和方法
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, UserProfile } from '@/lib/auth.service';
import { api } from '@/lib/api';
import { useSystem } from '@/contexts/SystemContext';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isSystemHealthy } = useSystem();

  // Check authentication status on mount
  // 在挂载时检查认证状态
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if user has a token stored
      // 检查用户是否存储了令牌
      const hasToken = api.hasToken();

      if (hasToken) {
        // Fetch current user info from API
        // 从 API 获取当前用户信息
        const userData = await authApi.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid tokens
      // 清除无效令牌
      api.removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string, rememberMe = false) => {
    const response = await authApi.login({ username, password, rememberMe });
    setUser(response.user);
  };

  const register = async (username: string, password: string, email?: string) => {
    const response = await authApi.register({ username, password, email });
    setUser(response.user);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const userData = await authApi.getCurrentUser();
    setUser(userData);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && isSystemHealthy,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use the auth context
 * 使用认证上下文的钩子
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
