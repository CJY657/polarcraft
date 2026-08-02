/**
 * Experiment Hierarchy - 实验层级模型
 *
 * 前端视图模型：单元 → 实验 → 课件材料 → 文件
 * 后端没有存储"文件夹"，这里根据现有媒体类型推导课件材料分组。
 */

import type { CourseData, MediaType } from "@/data/courses";
import { normalizeKnowledgeTag, type LabelI18n } from "@/lib/course.service";
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
  experiments: ExperimentSummary[];
}

/** 课件材料中的单个文件 */
export interface ExperimentFile {
  id: string;
  title: LabelI18n;
  type: MediaType;
  /** 没有 PPT 时使用主课件（PDF）兜底 */
  isMainSlide?: boolean;
}

/**
 * 推导实验下的课件材料：按现有顺序排列的 PPT；没有 PPT 时回退到主课件。
 * 视频、图片与补充 PDF 不进入目录，仍由右侧实验数据展示区承载。
 */
export function buildPresentationFiles(
  course: Pick<CourseData, "media" | "mainSlide"> | null | undefined,
): ExperimentFile[] {
  const presentationFiles = (course?.media ?? [])
    .filter((media) => media.type === "pptx")
    .map((media) => ({ id: media.id, title: media.title, type: media.type }));

  if (presentationFiles.length === 0 && course?.mainSlide) {
    return [
      {
        id: course.mainSlide.id,
        title: course.mainSlide.title,
        type: "pdf",
        isMainSlide: true,
      },
    ];
  }

  return presentationFiles;
}

/** 把公开单元与其课程摘要转换成层级视图模型（只保留基础知识实验） */
export function toHierarchyUnits(
  entries: Array<{ unit: Unit; courses: UnitCourse[] }>,
): HierarchyUnit[] {
  return entries.map(({ unit, courses }) => ({
    id: unit.id,
    title: unit.title,
    color: unit.color,
    experiments: courses
      .filter((course) => normalizeKnowledgeTag(course.knowledgeTag) === "foundation")
      .map((course) => ({
        id: course.id,
        unitId: unit.id,
        title: course.title,
        color: course.color,
      })),
  }));
}

/** 首个可用实验（用于 /experiments 无 ID 时的落位） */
export function findFirstExperimentId(units: HierarchyUnit[]): string | null {
  for (const unit of units) {
    const [firstExperiment] = unit.experiments;
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
    units.find((unit) => unit.experiments.some((experiment) => experiment.id === experimentId))
      ?.id ?? null
  );
}

/** 层级中的实验总数 */
export function countExperiments(units: HierarchyUnit[]): number {
  return units.reduce((total, unit) => total + unit.experiments.length, 0);
}
