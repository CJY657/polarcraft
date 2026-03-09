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

  const ghostButtonClass = cn(
    'glass-button inline-flex items-center justify-center rounded-full text-sm font-medium',
    compact ? 'px-3 py-2' : 'px-4 py-2',
    'text-[var(--text-secondary)] hover:text-[var(--paper-link)]'
  )

  const solidButtonClass = cn(
    'glass-button glass-button-primary inline-flex items-center justify-center rounded-full text-sm font-semibold',
    compact ? 'px-3 py-2' : 'px-4 py-2',
    'text-white'
  )

  const iconButtonClass = cn(
    'glass-button inline-flex items-center justify-center rounded-full',
    compact ? 'h-10 w-10' : 'px-4 py-2 gap-2',
    'text-[var(--text-secondary)] hover:text-[var(--paper-link)]'
  )

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
                className={ghostButtonClass}
              >
                {t('auth.login', '登录')}
              </button>
              <button
                onClick={() => openDialog('register')}
                className={solidButtonClass}
              >
                {t('auth.register', '注册')}
              </button>
            </>
          ) : null
        )}
        <button
          onClick={toggleTheme}
          className={cn(iconButtonClass, 'p-0')}
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
              className={ghostButtonClass}
            >
              {t('auth.login', '登录')}
            </button>
            <button
              onClick={() => openDialog('register')}
              className={solidButtonClass}
            >
              {t('auth.register', '注册')}
            </button>
          </div>
        ) : null
      )}

      {/* Theme Switcher */}
      <button
        onClick={toggleTheme}
        className={iconButtonClass}
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
        'glass-button inline-flex h-10 w-10 items-center justify-center rounded-full',
        'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
        className
      )}
      title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
