/**
 * Date/Time Formatting Utility
 * 日期时间格式化工具
 *
 * 仅收纳多处重复且输出完全一致的格式化函数。
 * 各页面输出不同文本的 formatDate 变体保持局部定义，避免改动渲染结果。
 */

import type { TFunction } from 'i18next';

// ponytail: 用 toLocaleString 而非缓存的 Intl.DateTimeFormat —— 后者对非法日期会抛 RangeError，
// 前者只渲染 "Invalid Date"。若真的成为性能瓶颈再换，并同时补上入参校验。
const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
};

/** 2026/01/28 21:30 —— 带年份的完整时间 */
export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN', DATE_TIME_OPTIONS);
}

/** 同上，空值渲染为破折号 */
export function formatDateTimeOrDash(value: string | null): string {
  if (!value) return '—';
  return formatDateTime(value);
}

/** 01/28 21:30 —— 不带年份 */
export function formatShortDateTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 刚刚 / N 分钟前 / N 小时前 / N 天前，超过 7 天回落到本地日期 */
export function formatRelativeTime(dateString: string, t: TFunction): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t('common.justNow', '刚刚');
  if (diffMins < 60) return t('common.minutesAgo', '{{count}} 分钟前', { count: diffMins });
  if (diffHours < 24) return t('common.hoursAgo', '{{count}} 小时前', { count: diffHours });
  if (diffDays < 7) return t('common.daysAgo', '{{count}} 天前', { count: diffDays });
  return date.toLocaleDateString();
}
