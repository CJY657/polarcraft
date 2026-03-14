/**
 * System Context
 * 系统上下文
 *
 * Provides system health status throughout the app
 * 在整个应用中提供系统健康状态
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { resolveApiBaseUrl } from '@/lib/api-base';

// =====================================================
// Types / 类型定义
// =====================================================

export type HealthStatus = 'healthy' | 'unhealthy' | 'checking' | 'offline';

export interface SystemHealthData {
  status: HealthStatus;
  timestamp: string | null;
  uptime: number | null;
  checks: {
    database: { status: 'up' | 'down'; latency?: number };
    server: { status: 'up' };
    uploads?: {
      status: 'up' | 'down';
      writable: boolean;
      path: string;
      error?: string;
    };
  } | null;
  lastChecked: Date | null;
  error: string | null;
}

interface SystemContextType {
  // Health status
  isSystemHealthy: boolean;
  healthStatus: HealthStatus;
  healthData: SystemHealthData;

  // Loading states
  isChecking: boolean;

  // Actions
  checkHealth: () => Promise<void>;
  startPeriodicCheck: (intervalMs?: number) => void;
  stopPeriodicCheck: () => void;
}

// =====================================================
// Context Definition / 上下文定义
// =====================================================

const SystemContext = createContext<SystemContextType | undefined>(undefined);

// Default health data
const defaultHealthData: SystemHealthData = {
  status: 'checking',
  timestamp: null,
  uptime: null,
  checks: null,
  lastChecked: null,
  error: null,
};

// Health check interval (default: 5 minutes)
const DEFAULT_HEALTH_CHECK_INTERVAL = 5 * 60 * 1000;

// Match the main API client behavior:
// - local dev can point to an explicit VITE_API_URL
// - production single-service deployments (e.g. Render) should use same-origin /api
const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL);

// =====================================================
// Provider Component / Provider 组件
// =====================================================

export function SystemProvider({ children }: { children: ReactNode }) {
  const [healthData, setHealthData] = useState<SystemHealthData>(defaultHealthData);
  const [isChecking, setIsChecking] = useState(false);
  const [periodicCheckId, setPeriodicCheckId] = useState<ReturnType<typeof setInterval> | null>(null);

  /**
   * Check system health
   * 检查系统健康状态
   */
  const checkHealth = useCallback(async () => {
    // Skip if already checking
    if (isChecking) return;

    setIsChecking(true);

    try {
      // Use a simple fetch with timeout for health check
      // Using fetch directly to avoid auth token requirement
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Health check failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setHealthData({
          status: data.data.status,
          timestamp: data.data.timestamp,
          uptime: data.data.uptime,
          checks: data.data.checks,
          lastChecked: new Date(),
          error: null,
        });
      } else {
        throw new Error(data.error?.message || 'Health check returned unsuccessful');
      }
    } catch (error) {
      const isOffline =
        !navigator.onLine ||
        (error instanceof Error && (
          error.name === 'AbortError' ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError')
        ));

      console.warn('[SystemContext] Health check failed:', error);

      setHealthData({
        status: isOffline ? 'offline' : 'unhealthy',
        timestamp: null,
        uptime: null,
        checks: null,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

  /**
   * Start periodic health check
   * 启动定期健康检查
   */
  const startPeriodicCheck = useCallback((intervalMs = DEFAULT_HEALTH_CHECK_INTERVAL) => {
    // Stop existing periodic check
    if (periodicCheckId) {
      clearInterval(periodicCheckId);
    }

    // Start new periodic check
    const id = setInterval(checkHealth, intervalMs);
    setPeriodicCheckId(id);
  }, [checkHealth, periodicCheckId]);

  /**
   * Stop periodic health check
   * 停止定期健康检查
   */
  const stopPeriodicCheck = useCallback(() => {
    if (periodicCheckId) {
      clearInterval(periodicCheckId);
      setPeriodicCheckId(null);
    }
  }, [periodicCheckId]);

  // Check health on mount
  useEffect(() => {
    checkHealth();
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      console.info('[SystemContext] Network connection restored, checking health...');
      checkHealth();
    };

    const handleOffline = () => {
      console.warn('[SystemContext] Network connection lost');
      setHealthData(prev => ({
        ...prev,
        status: 'offline',
        error: 'No network connection',
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkHealth]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (periodicCheckId) {
        clearInterval(periodicCheckId);
      }
    };
  }, [periodicCheckId]);

  // Compute derived values
  const isSystemHealthy = healthData.status === 'healthy';

  const value: SystemContextType = {
    isSystemHealthy,
    healthStatus: healthData.status,
    healthData,
    isChecking,
    checkHealth,
    startPeriodicCheck,
    stopPeriodicCheck,
  };

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  );
}

// =====================================================
// Hook / 钩子
// =====================================================

/**
 * Hook to use the system context
 * 使用系统上下文的钩子
 */
export function useSystem() {
  const context = useContext(SystemContext);
  if (context === undefined) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
}
