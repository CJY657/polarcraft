/**
 * Experiment Hierarchy - 实验层级模型
 *
 * 前端视图模型：单元 → 实验 → 文件
 * 后端没有存储"文件夹"，这里根据现有媒体类型推导目录分组。
 */

import type { CourseData, MediaType } from "@/data/courses";
import {
  normalizeKnowledgeTag,
  type KnowledgeTag,
  type LabelI18n,
} from "@/lib/course.service";
import type { Unit, UnitCourse } from "@/lib/unit.service";

/** 层级中的实验条目（仅展示所需字段） */
export interface ExperimentSummary {
  id: string;
  unitId: string;
  title: LabelI18n;
  color?: string;
}

/** 层级中的单元条目 */
export interface HierarchyUnit {
  id: string;
  title: LabelI18n;
  color: string;
  /** 实验直接挂在单元下，分类归属于实验内的文件。 */
  experiments: ExperimentSummary[];
}

/** 单元内的全部条目，保持接口排序。 */
export function listUnitExperiments(unit: HierarchyUnit): ExperimentSummary[] {
  return unit.experiments;
}

/** 实验目录中的单个文件 */
export interface ExperimentFile {
  id: string;
  title: LabelI18n;
  type: MediaType;
  experimentCategoryId?: string | null;
  /** 没有 PPT 时使用主课件（PDF）兜底 */
  isMainSlide?: boolean;
}

/**
 * 推导实验下的课件材料：按现有顺序排列的 PPT；没有 PPT 时回退到主课件。
 * 视频、图片与补充 PDF 由 buildExperimentalDataFiles 归入实验数据分组。
 */
export function buildPresentationFiles(
  course: Pick<CourseData, "media" | "mainSlide"> | null | undefined,
): ExperimentFile[] {
  const presentationFiles = (course?.media ?? [])
    .filter((media) => media.type === "pptx")
    .map((media) => ({ id: media.id, title: media.title, type: media.type, experimentCategoryId: media.experimentCategoryId }));

  if (presentationFiles.length === 0 && course?.mainSlide) {
    return [
      {
        id: course.mainSlide.id,
        title: course.mainSlide.title,
        type: "pdf",
        isMainSlide: true,
        experimentCategoryId: course.mainSlide.experimentCategoryId,
      },
    ];
  }

  return presentationFiles;
}

/**
 * 推导实验数据：保留现有顺序中的视频、图片与补充 PDF。
 * PPT 与主课件继续由课件材料分组承载。
 */
export function buildExperimentalDataFiles(
  course: Pick<CourseData, "media"> | null | undefined,
): ExperimentFile[] {
  return (course?.media ?? [])
    .filter((media) => media.type !== "pptx")
    .map((media) => ({ id: media.id, title: media.title, type: media.type, experimentCategoryId: media.experimentCategoryId }));
}

/** 把公开单元与其课程摘要转换成指定内容分类的层级视图模型 */
export function toHierarchyUnits(
  entries: Array<{ unit: Unit; courses: UnitCourse[] }>,
  knowledgeTag: KnowledgeTag = "foundation",
): HierarchyUnit[] {
  return entries
    .map(({ unit, courses }) => {
      const experiments = courses
        .filter((course) => normalizeKnowledgeTag(course.knowledgeTag) === knowledgeTag)
        .map((course) => ({
          id: course.id,
          unitId: unit.id,
          title: course.title,
          color: course.color,
        }));

      return {
        id: unit.id,
        title: unit.title,
        color: unit.color,
        experiments,
      };
    })
    .filter((unit) => unit.experiments.length > 0);
}

/** 首个可用实验（用于 /experiments 无 ID 时的落位） */
export function findFirstExperimentId(units: HierarchyUnit[]): string | null {
  for (const unit of units) {
    const [firstExperiment] = listUnitExperiments(unit);
    if (firstExperiment) {
      return firstExperiment.id;
    }
  }

  return null;
}

/** 当前实验所属单元，用于展开激活路径 */
export function findUnitIdForExperiment(
  units: HierarchyUnit[],
  experimentId: string | null,
): string | null {
  if (!experimentId) {
    return null;
  }

  return (
    units.find((unit) =>
      listUnitExperiments(unit).some((experiment) => experiment.id === experimentId),
    )?.id ?? null
  );
}

/** 层级中的实验总数 */
export function countExperiments(units: HierarchyUnit[]): number {
  return units.reduce((total, unit) => total + listUnitExperiments(unit).length, 0);
}
