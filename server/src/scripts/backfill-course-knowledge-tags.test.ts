import { describe, expect, it } from 'vitest';

import {
  buildSetKnowledgeTagUpdate,
  inferCourseKnowledgeTag,
} from './backfill-course-knowledge-tags.js';

describe('backfill-course-knowledge-tags helpers', () => {
  it('classifies optical-device courses from device keywords', () => {
    expect(
      inferCourseKnowledgeTag({
        id: 'course-device',
        title_zh: '第四单元——3种仪器介绍',
        title_en: null,
        description_zh: '缪勒显微镜和偏振散射仪',
        description_en: null,
      })
    ).toBe('optical_device');
  });

  it('defaults non-device courses to foundation', () => {
    expect(
      inferCourseKnowledgeTag({
        id: 'course-foundation',
        title_zh: '冰洲石实验',
        title_en: null,
        description_zh: '双折射基础现象',
        description_en: null,
      })
    ).toBe('foundation');
  });

  it('builds a non-destructive update that only sets the tag', () => {
    expect(buildSetKnowledgeTagUpdate('optical_device')).toEqual({
      $set: { knowledge_tag: 'optical_device' },
    });
  });
});
