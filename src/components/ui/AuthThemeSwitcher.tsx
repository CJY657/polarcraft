import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useSystem } from '@/contexts/SystemContext'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/utils/classNames'
import { Sun, Moon, User, LogOut, UserCircle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuthDialogStore } from '@/stores/authDialogStore'

interface AuthThemeSwitcherProps {
  className?: string
  compact?: boolean
}

export function AuthThemeSwitcher({ className, compact = false }: AuthThemeSwitcherProps) {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const { user, isAuthenticated, logout } = useAuth()
  const { isSystemHealthy } = useSystem()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const openDialog = useAuthDialogStore((state) => state.openDialog)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleProfile = () => {
    navigate('/profile')
    setShowUserMenu(false)
  }

  const handleLogout = async () => {
    await logout()
    setShowUserMenu(false)
    navigate('/')
  }

  // User dropdown menu classes - theme-aware
  const userMenuClasses = theme === 'dark'
    ? 'bg-slate-800 border-slate-700 shadow-xl'
    : 'bg-white border-gray-200 shadow-lg'

  const userMenuItemClasses = 'hover:bg-[var(--bg-tertiary)]'

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {/* Auth buttons or user menu (compact) */}
        {isAuthenticated ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]"
              title={user?.username || 'User'}
            >
              <User className="w-4 h-4" />
            </button>
            {showUserMenu && (
              <div className={cn(
                'absolute right-0 mt-2 w-48 rounded-lg border py-2 z-50',
                userMenuClasses
              )}>
                <div className="px-4 py-2 border-b border-[var(--border-color)]">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{user?.username}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{user?.email || 'user@polarcraft'}</p>
                </div>
                <button
                  onClick={handleProfile}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] flex items-center gap-2',
                    userMenuItemClasses
                  )}
                >
                  <UserCircle className="w-4 h-4" />
                  {t('profile.title', '个人中心')}
                </button>
                <button
                  onClick={handleLogout}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] flex items-center gap-2',
                    userMenuItemClasses
                  )}
                >
                  <LogOut className="w-4 h-4" />
                  {t('auth.logout', '登出')}
                </button>
              </div>
            )}
          </div>
        ) : (
          isSystemHealthy ? (
            <>
              <button
                onClick={() => openDialog('login')}
                className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] text-sm"
              >
                {t('auth.login', '登录')}
              </button>
              <button
                onClick={() => openDialog('register')}
                className="px-3 py-1.5 rounded-lg bg-[var(--accent-cyan)] text-black text-sm font-medium hover:bg-cyan-400 transition-colors"
              >
                {t('auth.register', '注册')}
              </button>
            </>
          ) : null
        )}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]"
          title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Auth buttons or user menu (full) */}
      {isAuthenticated ? (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-color)]',
              'text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]',
              'transition-all'
            )}
          >
            <User className="w-4 h-4" />
            <span className="text-sm">{user?.username || 'User'}</span>
          </button>
          {showUserMenu && (
            <div className={cn(
              'absolute right-0 mt-2 w-48 rounded-lg border py-2 z-50',
              userMenuClasses
            )}>
              <div className="px-4 py-2 border-b border-[var(--border-color)]">
                <p className="text-sm font-medium text-[var(--text-primary)]">{user?.username}</p>
                <p className="text-xs text-[var(--text-secondary)]">{user?.email || 'user@polarcraft'}</p>
              </div>
              <button
                onClick={handleProfile}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] flex items-center gap-2',
                  userMenuItemClasses
                )}
              >
                <UserCircle className="w-4 h-4" />
                {t('profile.title', '个人中心')}
              </button>
              <button
                onClick={handleLogout}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm text-[var(--text-secondary)] flex items-center gap-2',
                  userMenuItemClasses
                )}
              >
                <LogOut className="w-4 h-4" />
                {t('auth.logout', '登出')}
              </button>
            </div>
          )}
        </div>
      ) : (
        isSystemHealthy ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openDialog('login')}
              className={cn(
                'px-4 py-1.5 rounded-lg border border-[var(--border-color)]',
                'text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]',
                'transition-all text-sm font-medium'
              )}
            >
              {t('auth.login', '登录')}
            </button>
            <button
              onClick={() => openDialog('register')}
              className={cn(
                'px-4 py-1.5 rounded-lg bg-[var(--accent-cyan)] text-black',
                'hover:bg-cyan-400 transition-colors text-sm font-medium'
              )}
            >
              {t('auth.register', '注册')}
            </button>
          </div>
        ) : null
      )}

      {/* Theme Switcher */}
      <button
        onClick={toggleTheme}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-color)]',
          'text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]',
          'transition-all'
        )}
        title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
      >
        {theme === 'dark' ? (
          <>
            <Sun className="w-4 h-4" />
            <span className="text-xs">{t('common.lightMode')}</span>
          </>
        ) : (
          <>
            <Moon className="w-4 h-4" />
            <span className="text-xs">{t('common.darkMode')}</span>
          </>
        )}
      </button>
    </div>
  )
}

/**
 * Theme Switcher Only
 * 仅主题切换器
 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'p-2 rounded-lg border border-[var(--border-color)]',
        'text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]',
        'transition-all',
        className
      )}
      title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
