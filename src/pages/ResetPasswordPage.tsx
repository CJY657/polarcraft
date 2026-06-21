import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/lib/auth.service';
import {
  getPasswordRequirements,
  preparePasswordForRegistration,
  validatePassword,
} from '@/lib/password.util';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token')?.trim() || '';
  const passwordRequirements = useMemo(() => getPasswordRequirements(), []);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid' | 'success'>('checking');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const runValidation = async () => {
      if (!token) {
        setStatus('invalid');
        setError('缺少密码重置令牌，请重新从邮件中的链接进入。');
        return;
      }

      try {
        await authApi.validateResetToken(token);
        if (!cancelled) {
          setStatus('ready');
        }
      } catch (validationError) {
        if (!cancelled) {
          setStatus('invalid');
          setError(
            validationError instanceof Error
              ? validationError.message
              : '密码重置链接无效或已过期'
          );
        }
      }
    };

    void runValidation();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setError(validation.errors[0]);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsSubmitting(true);

    try {
      const { hashedPassword, salt } = await preparePasswordForRegistration(newPassword);
      await authApi.resetPassword(token, hashedPassword, salt);
      setStatus('success');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '密码重置失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (status === 'checking') {
      return (
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-semibold text-[var(--paper-foreground)]">校验重置链接</h1>
          <p className="text-sm leading-7 text-[var(--glass-text-muted)]">
            正在检查该密码重置链接是否仍然有效。
          </p>
        </div>
      );
    }

    if (status === 'invalid') {
      return (
        <div className="space-y-5 text-center">
          <h1 className="text-3xl font-semibold text-[var(--paper-foreground)]">链接已失效</h1>
          <p className="text-sm leading-7 text-[var(--glass-text-muted)]">{error}</p>
          <Link
            to="/forgot-password"
            className="glass-button glass-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white"
          >
            重新申请重置链接
          </Link>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="space-y-5 text-center">
          <h1 className="text-3xl font-semibold text-[var(--paper-foreground)]">密码已重置</h1>
          <p className="text-sm leading-7 text-[var(--glass-text-muted)]">
            你的密码已更新成功。请使用新密码重新登录。
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="glass-button glass-button-primary inline-flex rounded-full px-5 py-3 text-sm font-semibold text-white"
          >
            前往登录
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="mb-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--glass-text-muted)]">
            PolariScope
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--paper-foreground)]">设置新密码</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--glass-text-muted)]">
            输入新的登录密码。提交后，系统会自动让你在所有设备上重新登录。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="reset-password-new"
              className="text-sm font-medium text-[var(--paper-foreground)]"
            >
              新密码
            </label>
            <input
              id="reset-password-new"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              autoFocus
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-black/30"
              placeholder="请输入新密码"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="reset-password-confirm"
              className="text-sm font-medium text-[var(--paper-foreground)]"
            >
              确认新密码
            </label>
            <input
              id="reset-password-confirm"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-black/30"
              placeholder="请再次输入新密码"
            />
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-6 text-[var(--glass-text-muted)]">
            {passwordRequirements.map((requirement) => (
              <p key={requirement}>• {requirement}</p>
            ))}
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="glass-button glass-button-primary w-full rounded-full px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? '提交中...' : '重置密码'}
          </button>
        </form>
      </>
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
