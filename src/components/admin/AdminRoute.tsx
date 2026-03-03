/**
 * Admin Route Component
 * 管理员路由保护组件
 *
 * Protects routes that require admin privileges
 * 保护需要管理员权限的路由
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthDialogStore } from '@/stores/authDialogStore';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const openDialog = useAuthDialogStore((state) => state.openDialog);

  // Show loading state
  // 显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-cyan-400 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to home and open login dialog
  // 未认证 - 重定向到首页并打开登录对话框
  if (!isAuthenticated) {
    // Use setTimeout to ensure navigation happens after render
    // 使用 setTimeout 确保导航在渲染后发生
    setTimeout(() => {
      openDialog('login');
    }, 0);
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Authenticated but not admin - redirect to home
  // 已认证但不是管理员 - 重定向到首页
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">403</h1>
          <p className="text-gray-400 mb-6">Access Denied</p>
          <p className="text-gray-500 mb-6 text-sm">You need admin privileges to access this page.</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // User is admin - render children
  // 用户是管理员 - 渲染子组件
  return <>{children}</>;
}
