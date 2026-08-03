/**
 * Auth Dialog Component
 * 认证对话框组件，包含登录和注册表单的切换
 */

import { useState, FormEvent, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserType } from '@/lib/auth.service';
import { Dialog } from './dialog';
import { useAuthDialogStore, AuthMode } from '@/stores/authDialogStore';

// Password strength checker
function checkPasswordStrength(password: string): { strength: 'weak' | 'medium' | 'strong'; score: number } {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  if (score <= 2) return { strength: 'weak', score };
  if (score <= 4) return { strength: 'medium', score };
  return { strength: 'strong', score };
}

// Form switch animation variants
const formVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 }
  })
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Login Form Component
function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { closeDialog, consumeReturnTo } = useAuthDialogStore();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password, rememberMe);
      const returnTo = consumeReturnTo();
      closeDialog();
      if (returnTo) {
        navigate(returnTo, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请检查用户名和密码');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
    // Defer closeDialog so the route change commits first. Otherwise ProtectedRoute
    // (when login was triggered by gating a protected page) sees the dialog close
    // while it is still mounted and redirects to "/", swallowing the forgot-password
    // navigation.
    setTimeout(() => closeDialog(), 0);
  };

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="clay-badge mb-3">PolariScope</span>
        <h2
          className="text-3xl font-semibold text-clay-ink"
          style={{ fontFamily: "var(--font-ui-display)", letterSpacing: "-0.02em" }}
        >
          {t('auth.loginTitle', '欢迎回来')}
        </h2>
        <p className="mt-2 text-sm text-clay-body">{t('auth.loginSubtitle', '登录到您的账号')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-clay-coral/40 bg-clay-coral/10 px-4 py-3 text-sm text-clay-coral">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="login-username" className="mb-2 block text-sm font-semibold text-clay-ink">
            {t('auth.username', '用户名')}
          </label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            className="w-full rounded-xl border border-clay-surface-strong bg-white px-4 py-3 text-base text-clay-ink placeholder-clay-muted transition-all focus:border-clay-ink focus:outline-none focus:ring-2 focus:ring-clay-ink/10"
            placeholder={t('auth.usernamePlaceholder', '请输入用户名')}
          />
        </div>

        <div>
          <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-clay-ink">
            {t('auth.password', '密码')}
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-clay-surface-strong bg-white px-4 py-3 text-base text-clay-ink placeholder-clay-muted transition-all focus:border-clay-ink focus:outline-none focus:ring-2 focus:ring-clay-ink/10"
            placeholder={t('auth.passwordPlaceholder', '请输入密码')}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center">
            <input
              id="login-remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-clay-surface-strong bg-white text-clay-ink focus:ring-clay-ink/20"
            />
            <label htmlFor="login-remember" className="ml-2 text-sm text-clay-body">
              {t('auth.rememberMe', '记住我')}
            </label>
          </div>

          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm font-semibold text-clay-ink underline-offset-4 hover:underline"
          >
            {t('auth.forgotPassword', '忘记密码？')}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="clay-button-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? t('auth.loggingIn', '登录中...') : t('auth.login', '登录')}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="mt-6 text-center">
        <span className="text-sm text-clay-body">{t('auth.noAccount', '还没有账号？')}</span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="ml-1 text-sm font-semibold text-clay-ink underline-offset-4 hover:underline"
        >
          {t('auth.register', '注册')}
        </button>
      </div>
    </div>
  );
}

// Register Form Component
function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { t } = useTranslation();
  const { register } = useAuth();
  const { closeDialog, consumeReturnTo } = useAuthDialogStore();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [realName, setRealName] = useState('');
  const [userType, setUserType] = useState<UserType | ''>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = checkPasswordStrength(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim();

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (!realName.trim()) {
      setError('请输入真实姓名');
      return;
    }

    if (!userType) {
      setError('请选择账号身份');
      return;
    }

    if (!trimmedEmail) {
      setError('请输入邮箱');
      return;
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError('邮箱格式不正确');
      return;
    }

    if (password.length < 8) {
      setError('密码长度至少需要 8 个字符');
      return;
    }

    setIsLoading(true);

    try {
      await register(
        username.trim(),
        realName.trim(),
        password,
        trimmedEmail,
        userType
      );
      const returnTo = consumeReturnTo();
      closeDialog();
      if (returnTo) {
        navigate(returnTo, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength.strength) {
      case 'weak': return 'bg-clay-coral';
      case 'medium': return 'bg-clay-ochre';
      case 'strong': return 'bg-clay-mint';
    }
  };

  return (
    <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="clay-badge mb-3">PolariScope</span>
        <h2
          className="text-3xl font-semibold text-clay-ink"
          style={{ fontFamily: "var(--font-ui-display)", letterSpacing: "-0.02em" }}
        >
          {t('auth.registerTitle', '加入我们')}
        </h2>
        <p className="mt-2 text-sm text-clay-body">{t('auth.registerSubtitle', '创建您的账号')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-clay-coral/40 bg-clay-coral/10 px-4 py-3 text-sm text-clay-coral">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="register-username" className="mb-2 block text-sm font-semibold text-clay-ink">
            {t('auth.username', '用户名')} *
          </label>
          <input
            id="register-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            autoFocus
            className="w-full rounded-xl border border-clay-surface-strong bg-white px-4 py-3 text-base text-clay-ink placeholder-clay-muted transition-all focus:border-clay-ink focus:outline-none focus:ring-2 focus:ring-clay-ink/10"
            placeholder={t('auth.usernamePlaceholder', '请输入用户名')}
          />
        </div>

        <div>
          <label htmlFor="register-real-name" className="mb-2 block text-sm font-semibold text-clay-ink">
            {t('auth.realName', '真实姓名')} *
          </label>
          <input
            id="register-real-name"
            type="text"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            required
            className="w-full rounded-xl border border-clay-surface-strong bg-white px-4 py-3 text-base text-clay-ink placeholder-clay-muted transition-all focus:border-clay-ink focus:outline-none focus:ring-2 focus:ring-clay-ink/10"
            placeholder={t('auth.realNamePlaceholder', '请输入真实姓名')}
          />
        </div>

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
                  name="register-user-type"
                  value={value}
                  checked={userType === value}
                  onChange={() => {
                    setUserType(value);
                    setError('');
                  }}
                  required
                  className="h-4 w-4 border-clay-surface-strong text-clay-ink focus:ring-clay-ink/20"
                />
                <span>{value === 'student' ? '学生' : '教师'}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="register-email" className="mb-2 block text-sm font-semibold text-clay-ink">
            {t('auth.email', '邮箱')} *
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-clay-surface-strong bg-white px-4 py-3 text-base text-clay-ink placeholder-clay-muted transition-all focus:border-clay-ink focus:outline-none focus:ring-2 focus:ring-clay-ink/10"
            placeholder={t('auth.emailPlaceholder', '请输入邮箱')}
          />
          <p className="mt-2 text-xs text-clay-muted">用于接收密码重置链接</p>
        </div>

        <div>
          <label htmlFor="register-password" className="mb-2 block text-sm font-semibold text-clay-ink">
            {t('auth.password', '密码')} *
          </label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-clay-surface-strong bg-white px-4 py-3 text-base text-clay-ink placeholder-clay-muted transition-all focus:border-clay-ink focus:outline-none focus:ring-2 focus:ring-clay-ink/10"
            placeholder={t('auth.passwordPlaceholder', '请输入密码')}
          />

          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2">
              <div className="mb-1 flex gap-1">
                <div className={`h-1 flex-1 rounded ${passwordStrength.score >= 2 ? getStrengthColor() : 'bg-clay-surface-strong'}`} />
                <div className={`h-1 flex-1 rounded ${passwordStrength.score >= 3 ? getStrengthColor() : 'bg-clay-surface-strong'}`} />
                <div className={`h-1 flex-1 rounded ${passwordStrength.score >= 5 ? getStrengthColor() : 'bg-clay-surface-strong'}`} />
              </div>
              <p className="text-xs text-clay-muted">
                密码强度: <span className={`font-semibold ${
                  passwordStrength.strength === 'weak' ? 'text-clay-coral' :
                  passwordStrength.strength === 'medium' ? 'text-clay-ochre' :
                  'text-clay-ink'
                }`}>
                  {passwordStrength.strength === 'weak' ? '弱' : passwordStrength.strength === 'medium' ? '中' : '强'}
                </span>
              </p>
            </div>
          )}

          {/* Password Requirements */}
          <div className="mt-2 space-y-1 text-xs text-clay-muted">
            <p>密码需包含:</p>
            <ul className="ml-1 list-inside list-disc space-y-0.5">
              <li className={password.length >= 8 ? 'text-clay-ink font-medium' : ''}>至少 8 个字符</li>
              <li className={/[a-z]/.test(password) ? 'text-clay-ink font-medium' : ''}>小写字母</li>
              <li className={/[A-Z]/.test(password) ? 'text-clay-ink font-medium' : ''}>大写字母</li>
              <li className={/\d/.test(password) ? 'text-clay-ink font-medium' : ''}>数字</li>
              <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-clay-ink font-medium' : ''}>特殊字符</li>
            </ul>
          </div>
        </div>

        <div>
          <label htmlFor="register-confirm" className="mb-2 block text-sm font-semibold text-clay-ink">
            {t('auth.confirmPassword', '确认密码')} *
          </label>
          <input
            id="register-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-clay-surface-strong bg-white px-4 py-3 text-base text-clay-ink placeholder-clay-muted transition-all focus:border-clay-ink focus:outline-none focus:ring-2 focus:ring-clay-ink/10"
            placeholder={t('auth.confirmPasswordPlaceholder', '请再次输入密码')}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="clay-button-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? t('auth.registering', '注册中...') : t('auth.register', '注册')}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-6 text-center">
        <span className="text-sm text-clay-body">{t('auth.hasAccount', '已有账号？')}</span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="ml-1 text-sm font-semibold text-clay-ink underline-offset-4 hover:underline"
        >
          {t('auth.login', '登录')}
        </button>
      </div>
    </div>
  );
}

// Main AuthDialog Component
export function AuthDialog() {
  const { isOpen, mode, closeDialog, switchMode } = useAuthDialogStore();
  const prevModeRef = useRef<AuthMode>(mode);

  // Calculate direction for animation
  const direction = mode === 'register' ? 1 : -1;

  useEffect(() => {
    prevModeRef.current = mode;
  }, [mode]);

  const handleSwitchMode = (newMode: AuthMode) => {
    switchMode(newMode);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={closeDialog}
      className="overflow-hidden bg-clay-canvas border-clay-surface-strong"
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={mode}
          custom={direction}
          variants={formVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {mode === 'login' ? (
            <LoginForm onSwitchToRegister={() => handleSwitchMode('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => handleSwitchMode('login')} />
          )}
        </motion.div>
      </AnimatePresence>
    </Dialog>
  );
}
