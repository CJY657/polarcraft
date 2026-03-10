/**
 * API Client Configuration
 * API 客户端配置
 *
 * Authentication is handled via HTTP-only cookies
 * 认证通过 HTTP-only cookie 处理
 */

const configuredApiBaseUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
const isLocalhostApi =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredApiBaseUrl);
const API_BASE_URL = import.meta.env.PROD && isLocalhostApi ? '' : configuredApiBaseUrl;

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Token refresh state management
// Token 刷新状态管理
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;
let failedQueue: Array<{
  resolve: () => void;
  reject: (error: Error) => void;
}> = [];

/**
 * Process the failed request queue
 * 处理失败的请求队列
 */
function processQueue(error: Error | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
}

/**
 * Refresh access token via cookie
 * 通过 cookie 刷新访问令牌
 */
async function refreshAccessToken(): Promise<void> {
  // If already refreshing, return existing promise (avoid concurrent refresh)
  // 如果正在刷新，返回现有的 Promise（避免并发刷新）
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Send cookies
      body: JSON.stringify({}), // Backend reads from cookie
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error('Invalid refresh response');
    }
    // New tokens are set via cookie by backend
    // 新 token 由后端通过 cookie 设置
  })();

  try {
    await refreshPromise;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

/**
 * API request wrapper with automatic token refresh
 * API 请求包装器（带自动 token 刷新）
 */
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  const makeRequest = async (): Promise<Response> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    return fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Send cookies with every request
    });
  };

  try {
    const response = await makeRequest();
    const data = await response.json();

    // Handle 401 error - attempt to refresh token
    // 处理 401 错误 - 尝试刷新 token
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      // If already refreshing, queue this request
      // 如果正在刷新，将请求加入队列
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => {
              // Retry request after refresh
              // 刷新后重试请求
              makeRequest()
                .then((res) => res.json())
                .then(resolve)
                .catch(reject);
            },
            reject,
          });
        });
      }

      try {
        await refreshAccessToken();
        // Retry original request
        // 重试原始请求
        const retryResponse = await makeRequest();
        const retryData = await retryResponse.json();

        if (!retryResponse.ok) {
          throw new Error(retryData.error?.message || 'Request failed after refresh');
        }

        processQueue(null);
        return retryData;
      } catch (refreshError) {
        processQueue(refreshError as Error);
        // Trigger logout event for AuthContext to handle
        // 触发登出事件，让 AuthContext 处理
        window.dispatchEvent(new CustomEvent('auth:logout'));
        throw refreshError;
      }
    }

    if (!response.ok) {
      throw new Error(data.error?.message || data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * API Client Methods
 * API 客户端方法
 */
export const api = {
  get: <T = any>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T = any>(endpoint: string, body?: any) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),

  /**
   * Upload a file using FormData
   * 使用 FormData 上传文件
   */
  upload: async <T = any>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<T>> => {
    const url = `${API_BASE_URL}${endpoint}`;
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      // Don't set Content-Type - let browser set it with boundary
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || data.message || 'Upload failed');
    }

    return data;
  },

  // Token is managed via HTTP-only cookie, these are kept for compatibility
  // Token 通过 HTTP-only cookie 管理，以下方法保留用于兼容
  setToken: () => {
    console.warn('Token is managed via cookie, this method has no effect');
  },

  removeToken: () => {
    console.warn('Token is managed via cookie, call logout API instead');
  },

  getToken: () => {
    // Cannot read httpOnly cookie from JS
    // 无法从 JS 读取 httpOnly cookie
    return null;
  },

  hasToken: () => {
    // Cannot determine from JS, assume true
    // 无法从 JS 判断，假设有
    return true;
  },
};

export type { ApiResponse };
