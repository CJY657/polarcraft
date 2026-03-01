/**
 * Register Page - Redirects to home and opens register dialog
 * 注册页面 - 重定向到首页并打开注册对话框
 *
 * Note: Registration is now handled via AuthDialog modal
 * 注意：注册现在通过 AuthDialog 模态框处理
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthDialogStore } from '@/stores/authDialogStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const openDialog = useAuthDialogStore((state) => state.openDialog);

  useEffect(() => {
    openDialog('register');
    navigate('/', { replace: true });
  }, [openDialog, navigate]);

  return null;
}
