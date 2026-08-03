import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/auth.service';
import type { UserType } from '@/lib/auth.service';
import { Dialog } from '@/components/ui/dialog';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ProfileCompletionModal() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [realName, setRealName] = useState('');
  const [userType, setUserType] = useState<UserType | ''>('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const needsRealName = Boolean(
    user && user.role !== 'admin' && !user.real_name?.trim()
  );
  const needsEmail = Boolean(user && !user.email?.trim());
  const needsUserType = Boolean(user && !user.user_type);
  const shouldCompleteProfile = needsRealName || needsEmail || needsUserType;

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

    if (needsUserType && !userType) {
      setError('请选择账号身份');
      return;
    }

    const updates: { real_name?: string; email?: string; user_type?: UserType } = {};
    if (needsRealName) {
      updates.real_name = trimmedRealName;
    }
    if (needsEmail) {
      updates.email = trimmedEmail;
    }
    if (needsUserType) {
      updates.user_type = userType as UserType;
    }

    try {
      setIsSaving(true);
      await authApi.updateProfile(updates);
      await refreshUser();
      setRealName('');
      setUserType('');
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
    setUserType('');
    setEmail('');
    navigate('/');
  };

  const missingFields = [
    needsRealName ? '真实姓名' : null,
    needsEmail ? '邮箱' : null,
    needsUserType ? '账号身份' : null,
  ].filter((field): field is string => Boolean(field));
  const completionMessage = `继续使用 PolariScope 前，请补充${missingFields.join('、')}。${
    needsEmail ? '邮箱用于接收密码重置链接。' : ''
  }`;

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

          {needsUserType && (
            <fieldset>
              <legend className="mb-2 block text-sm font-semibold text-clay-ink">账号身份 *</legend>
              <div className="grid grid-cols-2 gap-3">
                {(['student', 'teacher'] as const).map((value) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                      userType === value
                        ? 'border-clay-ink bg-clay-surface text-clay-ink'
                        : 'border-clay-surface-strong bg-white text-clay-body hover:border-clay-ink/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="profile-completion-user-type"
                      value={value}
                      checked={userType === value}
                      onChange={() => {
                        setUserType(value);
                        setError('');
                      }}
                      required
                      autoFocus={!needsRealName && value === 'student'}
                      className="h-4 w-4 border-clay-surface-strong text-clay-ink focus:ring-clay-ink/20"
                    />
                    <span>{value === 'student' ? '学生' : '教师'}</span>
                  </label>
                ))}
              </div>
            </fieldset>
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
                autoFocus={!needsRealName && !needsUserType}
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
