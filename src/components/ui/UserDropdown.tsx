/**
 * UserDropdown Component
 * 用户下拉菜单组件 - 提供完整的用户导航和操作功能
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/classNames';
import {
  User,
  LogOut,
  UserCircle,
  Settings,
  ChevronRight,
  ChevronDown,
  Layers,
  BookOpen,
  FolderKanban,
  Bell,
} from 'lucide-react';

interface UserDropdownProps {
  className?: string;
  compact?: boolean;
}

// 动画配置
const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 25,
      staggerChildren: 0.03,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.98,
    transition: { duration: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 },
};

const submenuVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2 },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      duration: 0.25,
      staggerChildren: 0.05,
      when: 'beforeChildren',
    },
  },
};

const submenuItemVariants = {
  collapsed: { opacity: 0, x: -4 },
  expanded: { opacity: 1, x: 0 },
};

// 菜单项类型
interface MenuItem {
  id: string;
  label: string;
  icon: typeof User;
  onClick?: () => void;
  href?: string;
  isSubmenuTrigger?: boolean;
  isAdmin?: boolean;
}

export function UserDropdown({ className, compact = false }: UserDropdownProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [showAdminSubmenu, setShowAdminSubmenu] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 菜单项定义
  const menuItems: MenuItem[] = [
    {
      id: 'profile',
      label: t('profile.title', '个人中心'),
      icon: UserCircle,
      href: '/profile',
    },
    {
      id: 'inbox',
      label: t('inbox.title', '收件箱'),
      icon: Bell,
      href: '/inbox',
    },
    {
      id: 'research',
      label: t('research.myProjects', '我的课题'),
      icon: FolderKanban,
      href: '/lab',
    },
    ...(user?.role === 'admin'
      ? [
          {
            id: 'admin',
            label: t('admin.courseManagement', '课程管理'),
            icon: Settings,
            isSubmenuTrigger: true,
            isAdmin: true,
          },
        ]
      : []),
    {
      id: 'settings',
      label: t('settings.title', '设置'),
      icon: Settings,
      href: '/settings',
    },
    {
      id: 'logout',
      label: t('auth.logout', '登出'),
      icon: LogOut,
    },
  ];

  // 子菜单项
  const adminSubmenuItems = [
    {
      id: 'units',
      label: t('admin.units', '单元管理'),
      icon: Layers,
      href: '/admin/units',
    },
    {
      id: 'courses',
      label: t('admin.courses', '课程设置'),
      icon: BookOpen,
      href: '/admin/courses',
    },
  ];

  // 处理菜单项点击
  const handleItemClick = useCallback(
    (item: MenuItem) => {
      if (item.isSubmenuTrigger) {
        setShowAdminSubmenu((prev) => !prev);
        return;
      }

      if (item.id === 'logout') {
        logout().then(() => {
          navigate('/');
        });
      } else if (item.href) {
        navigate(item.href);
      }

      setIsOpen(false);
    },
    [logout, navigate]
  );

  // 处理子菜单项点击
  const handleSubmenuItemClick = (href: string) => {
    navigate(href);
    setIsOpen(false);
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 键盘导航
  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
      setShowAdminSubmenu(false);
      return;
    }

    const totalItems = showAdminSubmenu
      ? menuItems.length + adminSubmenuItems.length
      : menuItems.length;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % totalItems);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + totalItems) % totalItems);
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0) {
            const adminIndex = menuItems.findIndex((item) => item.isSubmenuTrigger);
            if (showAdminSubmenu && focusedIndex > adminIndex) {
              const submenuIndex = focusedIndex - adminIndex - 1;
              if (submenuIndex < adminSubmenuItems.length) {
                handleSubmenuItemClick(adminSubmenuItems[submenuIndex].href);
              }
            } else if (focusedIndex < menuItems.length) {
              handleItemClick(menuItems[focusedIndex]);
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, showAdminSubmenu, menuItems, adminSubmenuItems, handleItemClick]);

  // 主题感知样式
  const dropdownClasses = 'glass-panel-strong shadow-[0_24px_60px_-32px_rgba(2,10,22,0.56)]';

  const buttonClasses = cn(
    'glass-button relative rounded-xl p-2',
    'text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-tertiary)]',
    isOpen && 'text-[var(--accent-cyan)] bg-[var(--bg-tertiary)]'
  );

  const fullButtonClasses = cn(
    'glass-button flex items-center gap-2 rounded-full px-3 py-1.5',
    'text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:border-[var(--accent-cyan)]',
    'transition-all',
    isOpen && 'text-[var(--accent-cyan)] border-[var(--accent-cyan)]'
  );

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={compact ? buttonClasses : fullButtonClasses}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <User className="w-4 h-4" />
        {!compact && (
          <>
            <span className="text-sm">{user?.username || 'User'}</span>
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </>
        )}
      </button>

      {/* Dropdown 面板 */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="dropdown"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'absolute right-0 z-50 mt-2 w-[280px] rounded-[1.5rem] border py-2',
              dropdownClasses
            )}
          >
            {/* 用户信息头部 */}
            <div className="px-4 py-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                {/* 头像 */}
                <div
                  className={cn(
                    'glass-chip flex h-10 w-10 items-center justify-center overflow-hidden rounded-full'
                  )}
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User
                      className={cn(
                        'w-5 h-5',
                        'text-[var(--glass-text-muted)]'
                      )}
                    />
                  )}
                </div>
                {/* 用户信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {user?.username}
                    </p>
                    {user?.role === 'admin' && (
                      <span
                        className={cn(
                          'px-1.5 py-0.5 text-xs rounded',
                          theme === 'dark'
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-cyan-100 text-cyan-700'
                        )}
                      >
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {user?.email || 'user@polarcraft'}
                  </p>
                </div>
              </div>
            </div>

            {/* 菜单项 */}
            <div className="py-1">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isFocused = focusedIndex === index;
                const isAdminTrigger = item.isSubmenuTrigger;

                return (
                  <div key={item.id}>
                    <motion.button
                      variants={itemVariants}
                      onClick={() => handleItemClick(item)}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm flex items-center gap-3',
                        'text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]',
                        'hover:bg-gray-100 dark:hover:bg-white/10 transition-colors',
                        isFocused && 'bg-gray-100 dark:bg-white/10'
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {isAdminTrigger && (
                        <ChevronRight
                          className={cn(
                            'w-4 h-4 transition-transform duration-200',
                            showAdminSubmenu && 'rotate-90'
                          )}
                        />
                      )}
                    </motion.button>

                    {/* 管理员子菜单 */}
                    {isAdminTrigger && (
                      <AnimatePresence>
                        {showAdminSubmenu && (
                          <motion.div
                            initial="collapsed"
                            animate="expanded"
                            exit="collapsed"
                            variants={submenuVariants}
                            className="overflow-hidden"
                          >
                            {adminSubmenuItems.map((subItem, subIndex) => {
                              const SubIcon = subItem.icon;
                              const subFocusedIndex =
                                menuItems.findIndex((i) => i.isSubmenuTrigger) + 1 + subIndex;
                              const isSubFocused = focusedIndex === subFocusedIndex;

                              return (
                                <motion.button
                                  key={subItem.id}
                                  variants={submenuItemVariants}
                                  onClick={() => handleSubmenuItemClick(subItem.href)}
                                  className={cn(
                                    'w-full px-4 py-2 pl-11 text-left text-sm flex items-center gap-3',
                                    'text-[var(--text-secondary)] hover:text-[var(--accent-cyan)]',
                                    'hover:bg-gray-100 dark:hover:bg-white/10 transition-colors',
                                    isSubFocused && 'bg-gray-100 dark:bg-white/10'
                                  )}
                                >
                                  <SubIcon className="w-4 h-4 flex-shrink-0" />
                                  <span>{subItem.label}</span>
                                </motion.button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
