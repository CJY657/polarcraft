import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import { CourseModel } from '../models/course.model.js';
import { ExperimentCategoryModel } from '../models/experiment-category.model.js';
import { generateId } from '../utils/crypto.util.js';

function categoryMutation(operation: 'create' | 'update' | 'delete' | 'reorder') {
  return asyncHandler(async (req: Request, res: Response) => {
    const course = await CourseModel.getCourseById(req.params.id);
    if (!course) return res.error('实验不存在', 'NOT_FOUND', 404);
    if ((course.knowledge_tag ?? 'foundation') !== 'foundation') {
      return res.error('只有经典实验可以设置子分类', 'VALIDATION_ERROR', 400);
    }
    const categories = await ExperimentCategoryModel.getCategories(course);
    const { categoryId } = req.params;
    const nameZh = typeof req.body?.name_zh === 'string' ? req.body.name_zh.trim() : '';
    const nameEn = typeof req.body?.name_en === 'string' ? req.body.name_en.trim() : '';
    if ((operation === 'create' || operation === 'update') && !nameZh) {
      return res.error('缺少分类名称', 'VALIDATION_ERROR', 400);
    }
    if ((operation === 'update' || operation === 'delete') && !categories.some((c) => c.id === categoryId)) {
      return res.error('分类不存在', 'NOT_FOUND', 404);
    }
    let next = categories;
    const category = { id: operation === 'create' ? generateId() : categoryId, name_zh: nameZh, name_en: nameEn || null };
    if (operation === 'create') next = [...categories, category];
    if (operation === 'update') next = categories.map((c) => c.id === categoryId ? category : c);
    if (operation === 'delete') next = categories.filter((c) => c.id !== categoryId);
    if (operation === 'reorder') {
      const ids: unknown = req.body?.categoryIds;
      if (!Array.isArray(ids) || ids.length !== categories.length || new Set(ids).size !== ids.length ||
          ids.some((id) => typeof id !== 'string' || !categories.some((c) => c.id === id))) {
        return res.error('排序数据与现有分类不匹配', 'VALIDATION_ERROR', 400);
      }
      next = ids.map((id) => categories.find((c) => c.id === id)!);
    }
    await ExperimentCategoryModel.materialize(course);
    await ExperimentCategoryModel.setCategories(course.id, next);
    if (operation === 'delete') await ExperimentCategoryModel.clearAssignment(course.id, categoryId);
    const transform = (c: typeof category) => ({ id: c.id, name: { 'zh-CN': c.name_zh, 'en-US': c.name_en || undefined } });
    res.success(operation === 'delete' ? null : operation === 'reorder' ? next.map(transform) : transform(category),
      '分类已更新', operation === 'create' ? 201 : 200);
  });
}

export const ExperimentCategoryController = {
  create: categoryMutation('create'),
  update: categoryMutation('update'),
  delete: categoryMutation('delete'),
  reorder: categoryMutation('reorder'),
};
