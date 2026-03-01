/**
 * Auth Dialog Component
 * 认证对话框组件，包含登录和注册表单的切换
 */

import { useState, FormEvent, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
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

// Login Form Component
function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { closeDialog } = useAuthDialogStore();

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
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请检查用户名和密码');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-cyan-400 mb-1">PolarCraft</h2>
        <p className="text-slate-400 text-sm">{t('auth.loginSubtitle', '登录到您的账号')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="login-username" className="block text-sm font-medium text-slate-300 mb-2">
            {t('auth.username', '用户名')}
          </label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            placeholder={t('auth.usernamePlaceholder', '请输入用户名')}
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-slate-300 mb-2">
            {t('auth.password', '密码')}
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            placeholder={t('auth.passwordPlaceholder', '请输入密码')}
          />
        </div>

        <div className="flex items-center">
          <input
            id="login-remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-800"
          />
          <label htmlFor="login-remember" className="ml-2 text-sm text-slate-400">
            {t('auth.rememberMe', '记住我')}
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium py-3 px-4 rounded-lg hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('auth.loggingIn', '登录中...') : t('auth.login', '登录')}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="mt-6 text-center">
        <span className="text-slate-400 text-sm">{t('auth.noAccount', '还没有账号？')}</span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-cyan-400 hover:text-cyan-300 text-sm font-medium ml-1"
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
  const { closeDialog } = useAuthDialogStore();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = checkPasswordStrength(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 8) {
      setError('密码长度至少需要 8 个字符');
      return;
    }

    setIsLoading(true);

    try {
      await register(username, password, email || undefined);
      closeDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength.strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
    }
  };

  return (
    <div className="p-8 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-cyan-400 mb-1">PolarCraft</h2>
        <p className="text-slate-400 text-sm">{t('auth.registerSubtitle', '创建您的账号')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="register-username" className="block text-sm font-medium text-slate-300 mb-2">
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
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            placeholder={t('auth.usernamePlaceholder', '请输入用户名')}
          />
        </div>

        <div>
          <label htmlFor="register-email" className="block text-sm font-medium text-slate-300 mb-2">
            {t('auth.email', '邮箱')} ({t('auth.optional', '可选')})
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            placeholder={t('auth.emailPlaceholder', '请输入邮箱')}
          />
        </div>

        <div>
          <label htmlFor="register-password" className="block text-sm font-medium text-slate-300 mb-2">
            {t('auth.password', '密码')} *
          </label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            placeholder={t('auth.passwordPlaceholder', '请输入密码')}
          />

          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                <div className={`h-1 flex-1 rounded ${passwordStrength.score >= 2 ? getStrengthColor() : 'bg-slate-600'}`} />
                <div className={`h-1 flex-1 rounded ${passwordStrength.score >= 3 ? getStrengthColor() : 'bg-slate-600'}`} />
                <div className={`h-1 flex-1 rounded ${passwordStrength.score >= 5 ? getStrengthColor() : 'bg-slate-600'}`} />
              </div>
              <p className="text-xs text-slate-400">
                密码强度: <span className={`font-medium ${
                  passwordStrength.strength === 'weak' ? 'text-red-400' :
                  passwordStrength.strength === 'medium' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {passwordStrength.strength === 'weak' ? '弱' : passwordStrength.strength === 'medium' ? '中' : '强'}
                </span>
              </p>
            </div>
          )}

          {/* Password Requirements */}
          <div className="mt-2 text-xs text-slate-400 space-y-1">
            <p>密码需包含:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              <li className={password.length >= 8 ? 'text-green-400' : ''}>至少 8 个字符</li>
              <li className={/[a-z]/.test(password) ? 'text-green-400' : ''}>小写字母</li>
              <li className={/[A-Z]/.test(password) ? 'text-green-400' : ''}>大写字母</li>
              <li className={/\d/.test(password) ? 'text-green-400' : ''}>数字</li>
              <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-400' : ''}>特殊字符</li>
            </ul>
          </div>
        </div>

        <div>
          <label htmlFor="register-confirm" className="block text-sm font-medium text-slate-300 mb-2">
            {t('auth.confirmPassword', '确认密码')} *
          </label>
          <input
            id="register-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            placeholder={t('auth.confirmPasswordPlaceholder', '请再次输入密码')}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium py-3 px-4 rounded-lg hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('auth.registering', '注册中...') : t('auth.register', '注册')}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="mt-6 text-center">
        <span className="text-slate-400 text-sm">{t('auth.hasAccount', '已有账号？')}</span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-cyan-400 hover:text-cyan-300 text-sm font-medium ml-1"
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
      className="overflow-hidden"
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
