import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { authApi } from '@/lib/auth.service';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() || '';

  const [status, setStatus] = useState<'checking' | 'success' | 'invalid'>('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const runVerification = async () => {
      if (!token) {
        setStatus('invalid');
        setError('缺少验证令牌，请重新从邮件中的链接进入。');
        return;
      }

      try {
        await authApi.verifyEmail(token);
        if (!cancelled) {
          setStatus('success');
        }
      } catch (verifyError) {
        if (!cancelled) {
          setStatus('invalid');
          setError(
            verifyError instanceof Error ? verifyError.message : '邮箱验证链接无效或已过期'
          );
        }
      }
    };

    void runVerification();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const renderContent = () => {
    if (status === 'checking') {
      return (
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-semibold text-[var(--paper-foreground)]">正在验证邮箱</h1>
          <p className="text-sm leading-7 text-[var(--glass-text-muted)]">
            正在检查该验证链接是否仍然有效。
          </p>
        </div>
      );
    }

    if (status === 'invalid') {
      return (
        <div className="space-y-5 text-center">
          <h1 className="text-3xl font-semibold text-[var(--paper-foreground)]">链接已失效</h1>
          <p className="text-sm leading-7 text-[var(--glass-text-muted)]">{error}</p>
          <p className="text-sm leading-7 text-[var(--glass-text-muted)]">
            登录后可在个人资料中重新发送验证邮件。
          </p>
          <Link
            to="/profile"
            className="glass-button glass-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white"
          >
            前往个人资料
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-5 text-center">
        <h1 className="text-3xl font-semibold text-[var(--paper-foreground)]">邮箱验证成功</h1>
        <p className="text-sm leading-7 text-[var(--glass-text-muted)]">
          你的邮箱已验证，忘记密码时可以通过它接收重置链接。
        </p>
        <Link
          to="/"
          className="glass-button glass-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white"
        >
          返回首页
        </Link>
      </div>
    );
  };

  return (
    <div className="glass-page flex min-h-screen items-center justify-center px-6 py-16">
      <div className="glass-panel-strong w-full max-w-md rounded-[2rem] px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
}
