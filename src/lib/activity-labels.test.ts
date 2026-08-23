import { describe, expect, it } from 'vitest';

import { formatPagePath } from './activity-labels';

describe('formatPagePath timeline labels', () => {
  it('distinguishes the immersive entrance from the detailed timeline', () => {
    expect(formatPagePath('/chronicles')).toBe('实验内容 · 沉浸式时间线');
    expect(formatPagePath('/timeline')).toBe('实验内容 · 沉浸式时间线');
    expect(formatPagePath('/chronicles/explore')).toBe('实验内容 · 历史时间线详情');
  });
});
