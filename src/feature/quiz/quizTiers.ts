/**
 * Quiz tier presentation helpers (client-side).
 * 测验评级的前端展示辅助。
 *
 * Tier thresholds/ids come from the server; this maps a tier id to display
 * colors and shares a percent→tier fallback for rendering historical rows.
 * 评级阈值与 id 来自服务端；此处将 id 映射到展示颜色，并提供百分比→评级的兜底。
 */

import type { QuizTier } from '@/lib/quiz.service';

export interface TierStyle {
  /** Tailwind text color class. 文字颜色类。 */
  text: string;
  /** Tailwind background tint class. 背景色类。 */
  badge: string;
  /** Accent used for progress rings/bars. 进度环/条的强调色（十六进制）。 */
  accent: string;
}

export const TIER_STYLES: Record<string, TierStyle> = {
  novice: { text: 'text-stone-600', badge: 'bg-stone-100 text-stone-700', accent: '#78716c' },
  apprentice: { text: 'text-sky-600', badge: 'bg-sky-100 text-sky-700', accent: '#0284c7' },
  adept: { text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', accent: '#059669' },
  expert: { text: 'text-violet-600', badge: 'bg-violet-100 text-violet-700', accent: '#7c3aed' },
  master: { text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', accent: '#d97706' },
};

export const DEFAULT_TIER_STYLE: TierStyle = TIER_STYLES.novice;

export function tierStyle(tierId: string | null | undefined): TierStyle {
  if (!tierId) return DEFAULT_TIER_STYLE;
  return TIER_STYLES[tierId] ?? DEFAULT_TIER_STYLE;
}

/**
 * Resolve a percent to its tier from the server-provided ladder.
 * 依据服务端提供的评级阶梯，将百分比解析为对应评级。
 */
export function tierForPercent(percent: number, tiers: QuizTier[]): QuizTier | null {
  if (!tiers.length) return null;
  const ascending = [...tiers].sort((a, b) => a.minPercent - b.minPercent);
  let resolved = ascending[0];
  for (const tier of ascending) {
    if (percent >= tier.minPercent) resolved = tier;
  }
  return resolved;
}

/** Look up a tier's Chinese label by id. 按 id 查评级中文名。 */
export function tierLabelZh(tierId: string | null | undefined, tiers: QuizTier[]): string {
  if (!tierId) return '—';
  return tiers.find((tier) => tier.id === tierId)?.label.zh ?? tierId;
}
