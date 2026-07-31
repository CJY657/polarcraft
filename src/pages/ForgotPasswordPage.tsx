import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/lib/auth.service';

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await authApi.forgotPassword({
        username: username.trim(),
      });
      setMessage(response.data?.message || '如果该账号存在，系统会发送密码重置说明。');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '忘记密码请求失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-page flex min-h-screen items-center justify-center px-6 py-16">
      <div className="glass-panel-strong w-full max-w-md rounded-[2rem] px-8 py-8">
        <div className="mb-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--glass-text-muted)]">
            PolariScope
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[var(--paper-foreground)]">忘记密码</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--glass-text-muted)]">
            请输入用户名。系统会向该账号已绑定的邮箱发送密码重置邮件。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="forgot-password-username"
              className="text-sm font-medium text-[var(--paper-foreground)]"
            >
              用户名
            </label>
            <input
              id="forgot-password-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              autoFocus
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400/60 focus:bg-black/30"
              placeholder="请输入用户名"
            />
          </div>

          {message ? (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {message}
            </div>
          ) : null}

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
            {isSubmitting ? '提交中...' : '发送重置链接'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[var(--glass-text-muted)]">
          <Link to="/login" className="font-medium text-cyan-300 transition hover:text-cyan-200">
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}
