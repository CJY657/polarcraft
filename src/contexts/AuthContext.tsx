/**
 * Authentication Context
 * 认证上下文
 *
 * Provides authentication state and methods throughout the app
 * 在整个应用中提供认证状态和方法
 *
 * Authentication is handled via HTTP-only cookies
 * 认证通过 HTTP-only cookie 处理
 */

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { authApi, UserProfile } from '@/lib/auth.service';
import { useSystem } from '@/contexts/SystemContext';

// Token refresh configuration
// Token 刷新配置
const TOKEN_REFRESH_CONFIG = {
  // Refresh interval (milliseconds) - refresh every 10 minutes
  // 刷新间隔（毫秒）- 每 10 分钟刷新一次
  refreshInterval: 10 * 60 * 1000,
};

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

  // Timer reference for token refresh
  // Token 刷新定时器引用
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check authentication status on mount
  // 在挂载时检查认证状态
  useEffect(() => {
    checkAuth();

    // Listen for logout events from API client
    // 监听 API 客户端的登出事件
    const handleLogout = () => {
      setUser(null);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };

    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, []);

  // Start periodic token refresh when user is logged in
  // 用户登录后启动定期 token 刷新
  useEffect(() => {
    if (user) {
      // Clear existing timer
      // 清除现有定时器
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Set up periodic refresh
      // 设置定期刷新
      refreshIntervalRef.current = setInterval(async () => {
        try {
          await authApi.refreshToken();
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      }, TOKEN_REFRESH_CONFIG.refreshInterval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [user]);

  // Handle page visibility change - refresh token when page becomes visible
  // 处理页面可见性变化 - 页面重新可见时刷新 token
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        // Try to refresh token when page becomes visible
        // 页面重新可见时尝试刷新 token
        authApi.refreshToken().catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const checkAuth = async () => {
    try {
      // Try to get current user info - cookie is sent automatically
      // 尝试获取当前用户信息 - cookie 自动发送
      const userData = await authApi.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Not authenticated or session expired
      // 未认证或会话过期
      setUser(null);
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
