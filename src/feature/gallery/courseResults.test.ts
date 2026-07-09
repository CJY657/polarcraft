import { describe, expect, it } from 'vitest';

import type { Course } from '@/lib/course.service';

import {
  GALLERY_RESULTS_UNIT_ID,
  getGalleryWorkPrimaryUrl,
  isGalleryResultCourse,
  mapCourseToGalleryWork,
  parseGalleryCourseWorkId,
} from './courseResults';

const resultCourse: Course = {
  id: 'result-1',
  unitId: GALLERY_RESULTS_UNIT_ID,
  title: { 'zh-CN': '偏振海报' },
  description: { 'zh-CN': '学生海报成果' },
  color: '#264653',
  knowledgeTag: 'student_poster',
  sortOrder: 2,
  media: [
    {
      id: 'poster-pdf',
      type: 'pdf',
      url: '/uploads/courses/gallery-results/pdf/poster.pdf',
      title: { 'zh-CN': '海报 PDF' },
      knowledgeTag: 'student_poster',
      sortOrder: 0,
    },
  ],
  hyperlinks: [],
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-02T00:00:00.000Z',
};

describe('gallery course results', () => {
  it('detects managed gallery result courses only', () => {
    expect(isGalleryResultCourse(resultCourse)).toBe(true);
    expect(isGalleryResultCourse({ ...resultCourse, unitId: 'unit-1' })).toBe(false);
    expect(isGalleryResultCourse({ ...resultCourse, knowledgeTag: 'foundation' })).toBe(false);
  });

  it('maps a result course to a gallery card with PDF media', () => {
    const work = mapCourseToGalleryWork(resultCourse);

    expect(work.id).toBe('course:student_poster:result-1');
    expect(work.subtitle?.['zh-CN']).toBe('学生海报');
    expect(work.mediaResources).toEqual([
      expect.objectContaining({
        id: 'poster-pdf',
        type: 'pdf',
        url: '/uploads/courses/gallery-results/pdf/poster.pdf',
      }),
    ]);
    expect(getGalleryWorkPrimaryUrl(work)).toBe('/uploads/courses/gallery-results/pdf/poster.pdf');
  });

  it('parses gallery course work IDs', () => {
    expect(parseGalleryCourseWorkId('course:student_poster:result-1')).toEqual({
      tag: 'student_poster',
      courseId: 'result-1',
    });
    expect(parseGalleryCourseWorkId('bubble-polarization')).toBeNull();
    expect(parseGalleryCourseWorkId('course:foundation:result-1')).toBeNull();
    expect(parseGalleryCourseWorkId('course:student_poster:')).toBeNull();
  });
});
