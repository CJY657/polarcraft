import { describe, expect, it } from 'vitest';
import { extractTopicReferenceNumbers, splitTopicReferences } from './research-reference.util.js';

describe('splitTopicReferences', () => {
  it('splits a reference out of surrounding text without losing characters', () => {
    expect(splitTopicReferences('本课题延续 #42 的方法。')).toEqual([
      { type: 'text', value: '本课题延续 ' },
      { type: 'reference', number: 42 },
      { type: 'text', value: ' 的方法。' },
    ]);
  });

  it('matches a reference glued to CJK text on both sides', () => {
    expect(splitTopicReferences('见#7号')).toEqual([
      { type: 'text', value: '见' },
      { type: 'reference', number: 7 },
      { type: 'text', value: '号' },
    ]);
  });

  it('ignores markdown headings, mid-word hashes and trailing word characters', () => {
    for (const text of ['# 1 标题', '## 2', 'issue#3', '#4abc', '#5_6']) {
      expect(splitTopicReferences(text)).toEqual([{ type: 'text', value: text }]);
    }
  });

  it('keeps text unchanged when there is no reference', () => {
    expect(splitTopicReferences('no refs here')).toEqual([{ type: 'text', value: 'no refs here' }]);
    expect(splitTopicReferences('')).toEqual([]);
  });
});

describe('extractTopicReferenceNumbers', () => {
  it('dedupes and sorts across fields, skipping empty ones', () => {
    expect(extractTopicReferenceNumbers('#9 and #3', null, '#9', undefined, '')).toEqual([3, 9]);
  });

  it('returns nothing for text without references', () => {
    expect(extractTopicReferenceNumbers('# heading', 'a#1')).toEqual([]);
  });
});
