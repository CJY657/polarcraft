import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CourseRow } from '../types/course.types.js';

const db = vi.hoisted(() => ({
  units: { findOne: vi.fn() },
  courses: { updateOne: vi.fn(), findOne: vi.fn() },
  course_media: { updateMany: vi.fn() },
  course_main_slides: { updateMany: vi.fn() },
}));
vi.mock('../database/connection.js', () => ({ getCollection: (name: keyof typeof db) => db[name] }));
import { ExperimentCategoryModel } from './experiment-category.model.js';
import { CourseModel } from './course.model.js';

const categories = [{ id: 'custom', name_zh: 'Custom files', name_en: null }];
const course: CourseRow = {
  id: 'course-1', unit_id: 'unit-1', title_zh: 'Experiment', title_en: null,
  description_zh: null, description_en: null, cover_image: null, color: '#000',
  experiment_category_id: 'custom', sort_order: 0, created_at: new Date(), updated_at: new Date(),
};

describe('experiment category compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.units.findOne.mockResolvedValue({ id: 'unit-1', experiment_categories: categories });
    db.courses.findOne.mockResolvedValue(course);
    db.courses.updateOne.mockResolvedValue({ matchedCount: 1 });
  });

  it('reads legacy custom names without writing and treats explicit empty metadata as owned', async () => {
    expect(await ExperimentCategoryModel.getCategories(course)).toEqual(categories);
    expect(db.courses.updateOne).not.toHaveBeenCalled();
    db.units.findOne.mockClear();
    expect(await ExperimentCategoryModel.getCategories({ ...course, experiment_categories: [] })).toEqual([]);
    expect(db.units.findOne).not.toHaveBeenCalled();
  });

  it('inherits legacy assignments, honors explicit null and rejects stale references', () => {
    expect(ExperimentCategoryModel.resolveAssignment({}, course, categories)).toBe('custom');
    expect(ExperimentCategoryModel.resolveAssignment({ experiment_category_id: null }, course, categories)).toBeNull();
    expect(ExperimentCategoryModel.resolveAssignment({ experiment_category_id: 'other' }, course, categories)).toBeNull();
    expect(ExperimentCategoryModel.resolveAssignment({}, course, [])).toBeNull();
  });

  it('snapshots names and only missing file assignments for the requested experiment', async () => {
    expect(await ExperimentCategoryModel.materialize(course)).toEqual(categories);
    for (const collection of [db.course_media, db.course_main_slides]) {
      expect(collection.updateMany).toHaveBeenCalledWith(
        { course_id: 'course-1', experiment_category_id: { $exists: false } },
        { $set: { experiment_category_id: 'custom' } }
      );
    }
    expect(db.courses.updateOne).toHaveBeenCalledWith(
      { id: 'course-1', experiment_categories: { $exists: false } },
      { $set: { experiment_categories: categories } }
    );
  });

  it('clears assignments without deleting resources or changing sibling experiments', async () => {
    await ExperimentCategoryModel.clearAssignment('course-1', 'custom');
    for (const collection of [db.course_media, db.course_main_slides]) {
      expect(collection.updateMany).toHaveBeenCalledWith(
        { course_id: 'course-1', experiment_category_id: 'custom' },
        { $set: { experiment_category_id: null, updated_at: expect.any(Date) } }
      );
    }
  });

  it('preserves legacy categories and file assignments before moving to another unit', async () => {
    await CourseModel.updateCourse('course-1', { unitId: 'unit-2', experimentCategoryId: null });
    expect(db.units.findOne).toHaveBeenCalledWith({ id: 'unit-1' });
    expect(db.course_media.updateMany).toHaveBeenCalledWith(
      { course_id: 'course-1', experiment_category_id: { $exists: false } },
      { $set: { experiment_category_id: 'custom' } }
    );
    expect(db.courses.updateOne.mock.calls[0][1]).toEqual({ $set: { experiment_categories: categories } });
    expect(db.courses.updateOne).toHaveBeenLastCalledWith({ id: 'course-1' }, {
      $set: { unit_id: 'unit-2', experiment_category_id: null, updated_at: expect.any(Date) },
    });
  });
});
