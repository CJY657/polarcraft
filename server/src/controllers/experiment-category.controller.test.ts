import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCourseById: vi.fn(), getCategories: vi.fn(), materialize: vi.fn(),
  setCategories: vi.fn(), clearAssignment: vi.fn(),
}));
vi.mock('../models/course.model.js', () => ({ CourseModel: { getCourseById: mocks.getCourseById } }));
vi.mock('../models/experiment-category.model.js', () => ({ ExperimentCategoryModel: mocks }));
import { ExperimentCategoryController } from './experiment-category.controller.js';

const categories = [
  { id: 'cat-1', name_zh: 'Custom', name_en: 'English' },
  { id: 'cat-2', name_zh: 'Empty', name_en: null },
];
async function invoke(operation: keyof typeof ExperimentCategoryController, body = {}, categoryId = 'cat-1') {
  const res = { success: vi.fn(), error: vi.fn() };
  const next = vi.fn();
  ExperimentCategoryController[operation]({ params: { id: 'course-1', categoryId }, body } as any, res as any, next);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(next).not.toHaveBeenCalled();
  return res;
}

describe('experiment-owned category mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCourseById.mockResolvedValue({ id: 'course-1', unit_id: 'unit-1', knowledge_tag: 'foundation' });
    mocks.getCategories.mockResolvedValue(categories);
  });

  it('creates a named category within this experiment after snapshotting legacy data', async () => {
    const res = await invoke('create', { name_zh: ' New ', name_en: ' Extra ' });
    expect(mocks.materialize).toHaveBeenCalled();
    expect(mocks.setCategories).toHaveBeenCalledWith('course-1', [
      ...categories, { id: expect.any(String), name_zh: 'New', name_en: 'Extra' },
    ]);
    expect(res.success).toHaveBeenCalledWith(expect.objectContaining({ name: { 'zh-CN': 'New', 'en-US': 'Extra' } }), expect.any(String), 201);
  });

  it('renames, reorders and deletes without removing files', async () => {
    await invoke('update', { name_zh: 'Renamed' });
    expect(mocks.setCategories).toHaveBeenLastCalledWith('course-1', [{ ...categories[0], name_zh: 'Renamed', name_en: null }, categories[1]]);
    await invoke('reorder', { categoryIds: ['cat-2', 'cat-1'] });
    expect(mocks.setCategories).toHaveBeenLastCalledWith('course-1', [categories[1], categories[0]]);
    await invoke('delete');
    expect(mocks.setCategories).toHaveBeenLastCalledWith('course-1', [categories[1]]);
    expect(mocks.clearAssignment).toHaveBeenCalledWith('course-1', 'cat-1');
  });

  it.each([{ categoryIds: ['cat-1', 'cat-1'] }, { categoryIds: ['cat-2'] }, { categoryIds: ['cat-1', 'foreign'] }])('rejects invalid order %j before writes', async (body) => {
    const res = await invoke('reorder', body);
    expect(res.error).toHaveBeenCalledWith(expect.any(String), 'VALIDATION_ERROR', 400);
    expect(mocks.materialize).not.toHaveBeenCalled();
  });

  it('rejects blank names, foreign categories, missing experiments, and applications', async () => {
    expect((await invoke('create', { name_zh: ' ' })).error).toHaveBeenCalled();
    expect((await invoke('delete', {}, 'foreign')).error).toHaveBeenCalledWith(expect.any(String), 'NOT_FOUND', 404);
    mocks.getCourseById.mockResolvedValue(null);
    expect((await invoke('create', { name_zh: 'Name' })).error).toHaveBeenCalledWith(expect.any(String), 'NOT_FOUND', 404);
    mocks.getCourseById.mockResolvedValue({ knowledge_tag: 'optical_device' });
    expect((await invoke('create', { name_zh: 'Name' })).error).toHaveBeenCalledWith(expect.any(String), 'VALIDATION_ERROR', 400);
    expect(mocks.materialize).not.toHaveBeenCalled();
  });
});
