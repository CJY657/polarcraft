/**
 * Course Store (Public)
 * 课程 Store (公开)
 *
 * Manages public course data for display in the courses page
 * 管理用于课程页面显示的公开课程数据
 */

import { create } from "zustand";
import { courseApi, Course, CourseMedia, CourseHyperlink, MainSlide } from "@/lib/course.service";

interface CourseState {
  courses: Course[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCourses: () => Promise<void>;
  getCourseById: (id: string) => Course | undefined;
  clearError: () => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  isLoading: false,
  error: null,

  fetchCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      const courses = await courseApi.getPublicCourses();
      set({ courses, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch courses";
      set({ error: message, isLoading: false });
    }
  },

  getCourseById: (id: string) => {
    return get().courses.find((c) => c.id === id);
  },

  clearError: () => set({ error: null }),
}));

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
  clearError: () => void;
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
      const [course, mainSlide, media, hyperlinks] = await Promise.all([
        courseApi.getPublicCourse(courseId),
        courseApi.getPublicMainSlide(courseId),
        courseApi.getPublicMediaList(courseId),
        courseApi.getPublicHyperlinks(courseId),
      ]);

      set({
        course,
        mainSlide,
        media,
        hyperlinks,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch course";
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
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
