import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useSystem } from '@/contexts/SystemContext'
import { cn } from '@/utils/classNames'
import { useAuthDialogStore } from '@/stores/authDialogStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useEffect } from 'react'
import { InboxDropdown } from '@/components/ui/InboxDropdown'
import { UserDropdown } from '@/components/ui/UserDropdown'
import { WebsiteUpdatesDropdown } from '@/components/ui/WebsiteUpdatesDropdown'

interface AuthThemeSwitcherProps {
  className?: string
  compact?: boolean
}

export function AuthThemeSwitcher({ className, compact = false }: AuthThemeSwitcherProps) {
  const { t } = useTranslation()
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

  // Fetch unread notification count when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      return undefined
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 15000)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAuthenticated, fetchUnreadCount])

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {/* Auth buttons or user menu (compact) */}
        {isAuthenticated ? (
          <>
            {/* Website updates */}
            <WebsiteUpdatesDropdown />
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
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Auth buttons or user menu (full) */}
      {isAuthenticated ? (
        <>
          {/* Website updates */}
          <WebsiteUpdatesDropdown />
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
    </div>
  )
}
