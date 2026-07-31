import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/auth.service';
import { Dialog } from '@/components/ui/dialog';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ProfileCompletionModal() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [realName, setRealName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const needsRealName = Boolean(
    user && user.role !== 'admin' && !user.real_name?.trim()
  );
  const needsEmail = Boolean(user && !user.email?.trim());
  const shouldCompleteProfile = needsRealName || needsEmail;

  if (!shouldCompleteProfile) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedRealName = realName.trim();
    const trimmedEmail = email.trim();
    setError('');

    if (needsRealName && !trimmedRealName) {
      setError('请输入真实姓名');
      return;
    }

    if (needsEmail && !trimmedEmail) {
      setError('请输入邮箱');
      return;
    }

    if (needsEmail && !EMAIL_PATTERN.test(trimmedEmail)) {
      setError('邮箱格式不正确');
      return;
    }

    const updates: { real_name?: string; email?: string } = {};
    if (needsRealName) {
      updates.real_name = trimmedRealName;
    }
    if (needsEmail) {
      updates.email = trimmedEmail;
    }

    try {
      setIsSaving(true);
      await authApi.updateProfile(updates);
      await refreshUser();
      setRealName('');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存身份信息失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setRealName('');
    setEmail('');
    navigate('/');
  };

  const completionMessage = needsRealName && needsEmail
    ? '继续使用 PolariScope 前，请补充真实姓名和邮箱。邮箱用于接收密码重置链接。'
    : needsEmail
      ? '继续使用 PolariScope 前，请绑定邮箱，用于接收密码重置链接。'
      : '继续使用 PolariScope 前，请补充真实姓名。用户名将作为公开名称显示。';

  return (
    <Dialog
      isOpen
      onClose={() => undefined}
      closeOnEsc={false}
      closeOnOverlayClick={false}
      showCloseButton={false}
      className="border-clay-surface-strong bg-clay-canvas"
    >
      <div className="p-6 sm:p-7">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clay-surface">
            <UserRound className="h-5 w-5 text-clay-ink" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-clay-ink">完善身份信息</h2>
            <p className="mt-1 text-sm leading-6 text-clay-body">
              {completionMessage}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {needsRealName && (
            <div>
              <label htmlFor="profile-completion-real-name" className="mb-2 block text-sm font-semibold text-clay-ink">
                真实姓名 *
              </label>
              <input
                id="profile-completion-real-name"
                type="text"
                value={realName}
                onChange={(event) => {
                  setRealName(event.target.value);
                  setError('');
                }}
                required
                autoFocus
                className="w-full rounded-xl border border-clay-surface-strong bg-white px-4 py-3 text-base text-clay-ink placeholder-clay-muted transition-all focus:border-clay-ink focus:outline-none focus:ring-2 focus:ring-clay-ink/10"
                placeholder="请输入真实姓名"
              />
            </div>
          )}

          {needsEmail && (
            <div>
              <label htmlFor="profile-completion-email" className="mb-2 block text-sm font-semibold text-clay-ink">
                邮箱 *
              </label>
              <input
                id="profile-completion-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError('');
                }}
                required
                autoFocus={!needsRealName}
                className="w-full rounded-xl border border-clay-surface-strong bg-white px-4 py-3 text-base text-clay-ink placeholder-clay-muted transition-all focus:border-clay-ink focus:outline-none focus:ring-2 focus:ring-clay-ink/10"
                placeholder="请输入邮箱"
              />
              <p className="mt-2 text-xs text-clay-muted">用于接收密码重置链接</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-clay-coral/40 bg-clay-coral/10 px-4 py-3 text-sm text-clay-coral">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isSaving}
              className="rounded-xl border border-clay-surface-strong px-4 py-3 text-sm font-semibold text-clay-ink transition hover:bg-clay-surface disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
            >
              退出登录
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="clay-button-primary disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
            >
              {isSaving ? '保存中...' : '保存并继续'}
            </button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
