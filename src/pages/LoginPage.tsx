/**
 * Login Page - Redirects to home and opens login dialog
 * 登录页面 - 重定向到首页并打开登录对话框
 *
 * Note: Login is now handled via AuthDialog modal
 * 注意：登录现在通过 AuthDialog 模态框处理
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthDialogStore } from '@/stores/authDialogStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const openDialog = useAuthDialogStore((state) => state.openDialog);

  useEffect(() => {
    openDialog('login');
    navigate('/', { replace: true });
  }, [openDialog, navigate]);

  return null;
}
