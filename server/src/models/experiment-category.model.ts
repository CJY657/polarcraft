import { getCollection } from '../database/connection.js';
import { normalizeDocument } from '../database/mongo.util.js';
import type { CourseRow } from '../types/course.types.js';
import type { ExperimentCategory, UnitRow } from '../types/unit.types.js';

export class ExperimentCategoryModel {
  /** Missing metadata is legacy data; an explicit empty list must stay empty. */
  static async getCategories(course: CourseRow): Promise<ExperimentCategory[]> {
    if (course.experiment_categories !== undefined) return course.experiment_categories;
    const unit = normalizeDocument<UnitRow>(
      await getCollection('units').findOne({ id: course.unit_id })
    );
    return unit?.experiment_categories ?? [];
  }

  static resolveAssignment(
    resource: { experiment_category_id?: string | null },
    course: CourseRow,
    categories: ExperimentCategory[]
  ): string | null {
    const id = resource.experiment_category_id === undefined
      ? course.experiment_category_id
      : resource.experiment_category_id;
    return categories.some((category) => category.id === id) ? id! : null;
  }

  /** Snapshot legacy names and assignments before changing their unit or category. */
  static async materialize(course: CourseRow): Promise<ExperimentCategory[]> {
    const categories = await this.getCategories(course);
    const defaultId = this.resolveAssignment({}, course, categories);
    for (const collection of ['course_main_slides', 'course_media']) {
      await getCollection(collection).updateMany(
        { course_id: course.id, experiment_category_id: { $exists: false } },
        { $set: { experiment_category_id: defaultId } }
      );
    }
    await getCollection('courses').updateOne(
      { id: course.id, experiment_categories: { $exists: false } },
      { $set: { experiment_categories: categories } }
    );
    return categories;
  }

  static async setCategories(courseId: string, categories: ExperimentCategory[]): Promise<void> {
    await getCollection('courses').updateOne(
      { id: courseId },
      { $set: { experiment_categories: categories, updated_at: new Date() } }
    );
  }

  static async clearAssignment(courseId: string, categoryId: string): Promise<void> {
    for (const collection of ['course_main_slides', 'course_media']) {
      await getCollection(collection).updateMany(
        { course_id: courseId, experiment_category_id: categoryId },
        { $set: { experiment_category_id: null, updated_at: new Date() } }
      );
    }
  }
}
