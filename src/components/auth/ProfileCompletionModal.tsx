import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/auth.service';
import { Dialog } from '@/components/ui/dialog';

export function ProfileCompletionModal() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [realName, setRealName] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const shouldCompleteProfile = Boolean(
    user && user.role !== 'admin' && !user.real_name?.trim()
  );

  if (!shouldCompleteProfile) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedRealName = realName.trim();
    setError('');

    if (!trimmedRealName) {
      setError('请输入真实姓名');
      return;
    }

    try {
      setIsSaving(true);
      await authApi.updateProfile({ real_name: trimmedRealName });
      await refreshUser();
      setRealName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存真实姓名失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setRealName('');
    navigate('/');
  };

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
              继续使用 PolariScope 前，请补充真实姓名。昵称可稍后在个人中心修改。
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
