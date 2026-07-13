import { describe, expect, it } from 'vitest';
import { tierForPercent, tierLabelZh, tierStyle, DEFAULT_TIER_STYLE, TIER_STYLES } from './quizTiers';
import type { QuizTier } from '@/lib/quiz.service';

const TIERS: QuizTier[] = [
  { id: 'novice', label: { zh: '偏振新手', en: 'Novice' }, minPercent: 0 },
  { id: 'apprentice', label: { zh: '初窥门径', en: 'Apprentice' }, minPercent: 40 },
  { id: 'adept', label: { zh: '登堂入室', en: 'Adept' }, minPercent: 60 },
  { id: 'expert', label: { zh: '融会贯通', en: 'Expert' }, minPercent: 75 },
  { id: 'master', label: { zh: '偏振大师', en: 'Master' }, minPercent: 90 },
];

describe('tierForPercent', () => {
  it('resolves boundary percents to the right tier', () => {
    expect(tierForPercent(0, TIERS)?.id).toBe('novice');
    expect(tierForPercent(59, TIERS)?.id).toBe('apprentice');
    expect(tierForPercent(60, TIERS)?.id).toBe('adept');
    expect(tierForPercent(100, TIERS)?.id).toBe('master');
  });

  it('returns null for an empty ladder', () => {
    expect(tierForPercent(50, [])).toBeNull();
  });
});

describe('tierStyle', () => {
  it('maps every known tier id to a style and falls back for unknown ids', () => {
    for (const tier of TIERS) {
      expect(TIER_STYLES[tier.id]).toBeDefined();
    }
    expect(tierStyle('unknown-tier')).toBe(DEFAULT_TIER_STYLE);
    expect(tierStyle(null)).toBe(DEFAULT_TIER_STYLE);
  });
});

describe('tierLabelZh', () => {
  it('returns the Chinese label or a dash for missing tiers', () => {
    expect(tierLabelZh('master', TIERS)).toBe('偏振大师');
    expect(tierLabelZh(null, TIERS)).toBe('—');
    expect(tierLabelZh('ghost', TIERS)).toBe('ghost');
  });
});
