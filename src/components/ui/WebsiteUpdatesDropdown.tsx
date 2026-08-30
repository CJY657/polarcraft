/**
 * WebsiteUpdatesDropdown Component
 * 网站更新下拉组件 - 展示最近的、用户可见的网站改动
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { getStorageItem, setStorageItem } from '@/lib/storage';

const LAST_SEEN_STORAGE_KEY = 'polariscope.websiteUpdates.lastSeenId';
const MAX_VISIBLE_UPDATES = 5;

interface WebsiteUpdate {
  id: string;
  /** 中文展示日期 */
  date: string;
  title: string;
  description: string;
  /** 站内路由，可选 */
  href?: string;
}

// ponytail: 更新条目跟随部署手写维护，只保留最新 5 条；等更新频率超过发版频率再考虑后端接口与管理后台。
// 每次发布用户可见的新功能时，都必须在最前面添加通知，并使用新的 id（id 变化才会重新出现小圆点）。
const WEBSITE_UPDATES: WebsiteUpdate[] = [
  {
    id: '2026-08-30-public-project-cards',
    date: '2026年8月30日',
    title: '公开课题浏览更清爽',
    description:
      '进入“实验室 → 公开课题”时，课题卡片现在会集中展示课题阶段、挑战难度、组长和成员，减少重复信息，方便你在浏览多个课题时快速比较。查看详情和申请加入的入口保持不变；更多任务分工、招募与评审信息可进入课题详情页查看。',
    href: '/lab/explore',
  },
  {
    id: '2026-08-28-public-feedback-wall',
    date: '2026年8月28日',
    title: '公开反馈墙上线',
    description:
      '登录后，你现在可以在提交反馈时选择是否公开，并在反馈表单下方查看大家公开的实验问题与产品建议。公开内容会展示主题、正文和用户名，方便彼此参考与交流；联系邮箱、提交环境和附图不会公开。取消勾选的反馈及未登录提交的反馈仍只对管理员可见。',
    href: '/feedback',
  },
  {
    id: '2026-08-28-feedback-images',
    date: '2026年8月28日',
    title: '反馈支持附图',
    description:
      '提交网站问题或改进建议时，现在可以附上一张 JPG、PNG 或 WebP 图片，并在提交前预览、更换或移除，图片最大为 5 MB。管理员可以随反馈查看原图，更快定位页面显示或实验内容问题；请勿上传包含个人隐私等敏感信息的图片。',
    href: '/feedback',
  },
  {
    id: '2026-08-23-immersive-timeline',
    date: '2026年8月23日',
    title: '沉浸式光学历史之旅',
    description:
      '现在可以向下滚动，沿着昼夜变化的场景穿梭偏振光历史中的重要节点；点击事件卡片即可阅读完整故事，并继续查看上一项或下一项。你也可以随时进入完整时间线；如果启用了“减少动态效果”，或设备无法显示飞行场景，仍可直接浏览全部内容。',
    href: '/chronicles',
  },
  {
    id: '2026-08-21-curriculum-navigation',
    date: '2026年8月21日',
    title: '实验与应用目录焕新',
    description:
      '实验内容和前沿应用现在按“单元 → 实验/应用 → 文件”清晰展开，课件、视频、图片和 PDF 可以直接选择，不再需要逐层打开资源文件夹。桌面端目录固定在左侧，手机端可快速打开目录，并在选择内容后自动收起。',
    href: '/experiments',
  },
];

interface WebsiteUpdatesDropdownProps {
  className?: string;
}

export function WebsiteUpdatesDropdown({ className }: WebsiteUpdatesDropdownProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [lastSeenId, setLastSeenId] = useState(() => getStorageItem(LAST_SEEN_STORAGE_KEY));
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updates = WEBSITE_UPDATES.slice(0, MAX_VISIBLE_UPDATES);
  const newestId = updates[0]?.id;
  const hasUnseen = Boolean(newestId) && lastSeenId !== newestId;

  // 打开时记录已看过的最新条目 / Mark the newest entry as seen when opening
  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    setIsOpen(true);
    if (newestId && newestId !== lastSeenId) {
      setStorageItem(LAST_SEEN_STORAGE_KEY, newestId);
      setLastSeenId(newestId);
    }
  };

  // 点击外部关闭 / Esc 关闭并把焦点还给按钮
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={cn(
          'glass-button relative rounded-xl p-2',
          'text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] hover:bg-[var(--bg-tertiary)]'
        )}
        title="网站更新"
        aria-label={hasUnseen ? '网站更新（有新内容）' : '网站更新'}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Megaphone className="w-4 h-4" />
        {hasUnseen && (
          <span
            aria-hidden="true"
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-500"
          />
        )}
      </button>

      {isOpen && (
        <div
          role="region"
          aria-label="网站更新"
          className={cn(
            'fixed left-3 right-3 top-20 z-50 rounded-[1.5rem] py-2',
            'sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80',
            'glass-panel-strong shadow-[0_24px_60px_-32px_rgba(2,10,22,0.56)]'
          )}
        >
          <div className="px-4 py-2 border-b border-[var(--paper-border)]">
            <h3 className="text-sm font-medium">网站更新</h3>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {updates.map((update) => {
              const body = (
                <>
                  <p className="text-xs text-[var(--paper-muted)]">{update.date}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm font-medium">
                    <span className="flex-1">{update.title}</span>
                    {update.href && (
                      <ChevronRight className="w-4 h-4 flex-shrink-0 text-[var(--paper-muted)]" />
                    )}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--paper-muted)]">
                    {update.description}
                  </p>
                </>
              );

              const rowClass =
                'w-full px-4 py-3 text-left border-b border-[var(--paper-border)] last:border-b-0';

              return update.href ? (
                <button
                  key={update.id}
                  type="button"
                  onClick={() => {
                    navigate(update.href as string);
                    setIsOpen(false);
                  }}
                  className={cn(
                    rowClass,
                    'transition-colors hover:bg-[var(--glass-panel-soft)]'
                  )}
                >
                  {body}
                </button>
              ) : (
                <div key={update.id} className={rowClass}>
                  {body}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
