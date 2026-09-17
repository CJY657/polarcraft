import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUnitModel, mockCourseModel } = vi.hoisted(() => ({
  mockUnitModel: {
    getUnitById: vi.fn(),
    getMainSlide: vi.fn(),
    getCoursesByUnit: vi.fn(),
    createExperimentCategory: vi.fn(),
    updateExperimentCategory: vi.fn(),
    deleteExperimentCategory: vi.fn(),
    reorderExperimentCategories: vi.fn(),
  },
  mockCourseModel: {
    getMainSlide: vi.fn(),
    getMediaByCourse: vi.fn(),
  },
}));

vi.mock('../models/unit.model.js', () => ({ UnitModel: mockUnitModel }));
vi.mock('../models/course.model.js', () => ({ CourseModel: mockCourseModel }));
vi.mock('../services/managed-upload-cleanup.service.js', () => ({
  ManagedUploadCleanupService: { cleanupUrls: vi.fn(), collectUnitResourceUrls: vi.fn() },
}));

import { UnitController } from './unit.controller.js';

const now = new Date('2026-09-16T00:00:00.000Z');
const admin = { username: 'admin' };

function createResponse() {
  return { success: vi.fn(), error: vi.fn() };
}

async function invoke(handler: (req: any, res: any, next: any) => void, req: any) {
  const res = createResponse();
  const next = vi.fn();
  handler(req, res, next);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(next).not.toHaveBeenCalled();
  return res;
}

describe('UnitController experiment categories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects a blank Chinese name', async () => {
    const res = await invoke(UnitController.createExperimentCategory, {
      params: { id: 'unit-1' },
      body: { name_zh: '   ', name_en: 'Basic' },
      user: admin,
    });

    expect(res.error).toHaveBeenCalledWith('缺少分类名称', 'VALIDATION_ERROR', 400);
    expect(mockUnitModel.createExperimentCategory).not.toHaveBeenCalled();
  });

  it('creates a category with optional English name and returns i18n shape', async () => {
    mockUnitModel.createExperimentCategory.mockResolvedValue({
      id: 'cat-1',
      name_zh: '基础实验',
      name_en: null,
    });

    const res = await invoke(UnitController.createExperimentCategory, {
      params: { id: 'unit-1' },
      body: { name_zh: ' 基础实验 ' },
      user: admin,
    });

    expect(mockUnitModel.createExperimentCategory).toHaveBeenCalledWith('unit-1', {
      name_zh: '基础实验',
      name_en: undefined,
    });
    expect(res.success).toHaveBeenCalledWith(
      { id: 'cat-1', name: { 'zh-CN': '基础实验', 'en-US': undefined } },
      '分类创建成功',
      201
    );
  });

  it('returns 404 when renaming a missing category', async () => {
    mockUnitModel.updateExperimentCategory.mockResolvedValue(null);

    const res = await invoke(UnitController.updateExperimentCategory, {
      params: { id: 'unit-1', categoryId: 'nope' },
      body: { name_zh: '拓展实验' },
      user: admin,
    });

    expect(res.error).toHaveBeenCalledWith('分类不存在', 'NOT_FOUND', 404);
  });

  it('deletes a category through the model (which clears assignments)', async () => {
    mockUnitModel.deleteExperimentCategory.mockResolvedValue(true);

    const res = await invoke(UnitController.deleteExperimentCategory, {
      params: { id: 'unit-1', categoryId: 'cat-1' },
      user: admin,
    });

    expect(mockUnitModel.deleteExperimentCategory).toHaveBeenCalledWith('unit-1', 'cat-1');
    expect(res.success).toHaveBeenCalledWith(null, '分类删除成功');
  });

  it('rejects reorder payloads that are not string arrays or mismatch the model', async () => {
    const bad = await invoke(UnitController.reorderExperimentCategories, {
      params: { id: 'unit-1' },
      body: { categoryIds: 'cat-1' },
      user: admin,
    });
    expect(bad.error).toHaveBeenCalledWith('无效的排序数据', 'VALIDATION_ERROR', 400);

    mockUnitModel.reorderExperimentCategories.mockResolvedValue(null);
    const mismatch = await invoke(UnitController.reorderExperimentCategories, {
      params: { id: 'unit-1' },
      body: { categoryIds: ['cat-2'] },
      user: admin,
    });
    expect(mismatch.error).toHaveBeenCalledWith(
      '排序数据与现有分类不匹配',
      'VALIDATION_ERROR',
      400
    );
  });

  it('exposes categories on public units and treats legacy documents as empty', async () => {
    mockUnitModel.getUnitById.mockResolvedValue({
      id: 'unit-1',
      title_zh: '单元',
      title_en: null,
      description_zh: null,
      description_en: null,
      cover_image: null,
      color: '#000',
      sort_order: 0,
      created_at: now,
      updated_at: now,
    });
    mockUnitModel.getMainSlide.mockResolvedValue(null);
    mockUnitModel.getCoursesByUnit.mockResolvedValue([
      {
        id: 'course-1',
        unit_id: 'unit-1',
        title_zh: '实验',
        title_en: null,
        description_zh: null,
        description_en: null,
        cover_image: null,
        color: '#000',
        knowledge_tag: 'optical_device',
        experiment_category_id: 'stale',
        sort_order: 0,
        created_at: now,
        updated_at: now,
      },
    ]);

    const res = await invoke(UnitController.getPublicUnit, { params: { id: 'unit-1' } });

    const payload = res.success.mock.calls[0][0];
    expect(payload.experimentCategories).toEqual([]);
    // 非经典实验模块的分类引用被忽略
    expect(payload.courses[0].experimentCategoryId).toBeNull();
  });
});
