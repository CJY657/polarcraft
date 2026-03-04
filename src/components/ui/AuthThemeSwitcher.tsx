import { useTranslation } from 'react-i18next'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useSystem } from '@/contexts/SystemContext'
import { cn } from '@/utils/classNames'
import { Sun, Moon } from 'lucide-react'
import { useAuthDialogStore } from '@/stores/authDialogStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useEffect } from 'react'
import { InboxDropdown } from '@/components/ui/InboxDropdown'
import { UserDropdown } from '@/components/ui/UserDropdown'

interface AuthThemeSwitcherProps {
  className?: string
  compact?: boolean
}

export function AuthThemeSwitcher({ className, compact = false }: AuthThemeSwitcherProps) {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const { isAuthenticated } = useAuth()
  const { isSystemHealthy } = useSystem()
  const openDialog = useAuthDialogStore((state) => state.openDialog)
  const fetchUnreadCount = useNotificationStore((state) => state.fetchUnreadCount)

  // Fetch unread notification count when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount()
      // Poll for new notifications every 60 seconds
      const interval = setInterval(fetchUnreadCount, 60000)
      return () => clearInterval(interval)
    }
    return undefined
  }, [isAuthenticated, fetchUnreadCount])

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {/* Auth buttons or user menu (compact) */}
        {isAuthenticated ? (
          <>
            {/* Inbox */}
            <InboxDropdown />
            {/* User Menu */}
            <UserDropdown compact />
          </>
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
        <>
          {/* Inbox */}
          <InboxDropdown />
          {/* User Menu */}
          <UserDropdown />
        </>
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
