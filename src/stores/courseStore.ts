/**
 * Course Store (Public)
 * 课程 Store (公开)
 *
 * Manages public course data for display in the courses page
 * 管理用于课程页面显示的公开课程数据
 */

import { create } from "zustand";
import {
  courseApi,
  Course,
  CourseMedia,
  CourseHyperlink,
  MainSlide,
  normalizeKnowledgeTag,
} from "@/lib/course.service";

function normalizeCourse(course: Course): Course {
  return {
    ...course,
    knowledgeTag: normalizeKnowledgeTag(course.knowledgeTag),
    mainSlide: course.mainSlide
      ? { ...course.mainSlide, knowledgeTag: normalizeKnowledgeTag(course.mainSlide.knowledgeTag) }
      : undefined,
    media: Array.isArray(course.media)
      ? course.media.map((item) => ({
          ...item,
          knowledgeTag: normalizeKnowledgeTag(item.knowledgeTag),
        }))
      : [],
    hyperlinks: Array.isArray(course.hyperlinks) ? course.hyperlinks : [],
  };
}

// =====================================================
// Course Detail Store (for individual course page)
// 课程详情 Store (用于单个课程页面)
// =====================================================

interface CourseDetailState {
  course: Course | null;
  mainSlide: MainSlide | null;
  media: CourseMedia[];
  hyperlinks: CourseHyperlink[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCourse: (courseId: string) => Promise<void>;
  reset: () => void;
}

export const useCourseDetailStore = create<CourseDetailState>((set) => ({
  course: null,
  mainSlide: null,
  media: [],
  hyperlinks: [],
  isLoading: false,
  error: null,

  fetchCourse: async (courseId: string) => {
    set({ isLoading: true, error: null });
    try {
      const course = normalizeCourse(await courseApi.getPublicCourse(courseId));

      set({
        course,
        mainSlide: course.mainSlide ?? null,
        media: course.media ?? [],
        hyperlinks: course.hyperlinks ?? [],
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch course";
      set({ error: message, isLoading: false });
    }
  },

  reset: () =>
    set({
      course: null,
      mainSlide: null,
      media: [],
      hyperlinks: [],
      isLoading: false,
      error: null,
    }),
}));
