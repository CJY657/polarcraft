/**
 * Course Admin Store
 * 课程管理状态管理
 */

import { create } from 'zustand';
import {
  courseApi,
  Course,
  CourseMedia,
  CourseHyperlink,
  MainSlide,
  CreateCourseInput,
  UpdateCourseInput,
  UpsertMainSlideInput,
  CreateMediaInput,
  UpdateMediaInput,
  CreateHyperlinkInput,
  UpdateHyperlinkInput,
} from '@/lib/course.service';

interface CourseAdminState {
  // State
  courses: Course[];
  currentCourse: Course | null;
  isLoading: boolean;
  error: string | null;

  // Course Actions
  fetchCourses: () => Promise<void>;
  fetchCourse: (id: string) => Promise<void>;
  createCourse: (data: CreateCourseInput) => Promise<Course>;
  updateCourse: (id: string, data: UpdateCourseInput) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;

  // Main Slide Actions
  upsertMainSlide: (courseId: string, data: UpsertMainSlideInput) => Promise<MainSlide>;
  deleteMainSlide: (courseId: string) => Promise<void>;

  // Media Actions
  createMedia: (courseId: string, data: CreateMediaInput) => Promise<CourseMedia>;
  updateMedia: (mediaId: string, data: UpdateMediaInput) => Promise<CourseMedia>;
  deleteMedia: (mediaId: string) => Promise<void>;
  reorderMedia: (courseId: string, mediaIds: string[]) => Promise<void>;

  // Hyperlink Actions
  createHyperlink: (courseId: string, data: CreateHyperlinkInput) => Promise<CourseHyperlink>;
  updateHyperlink: (hyperlinkId: string, data: UpdateHyperlinkInput) => Promise<CourseHyperlink>;
  deleteHyperlink: (hyperlinkId: string) => Promise<void>;

  // Utility
  clearError: () => void;
  reset: () => void;
  setCurrentCourse: (course: Course | null) => void;
}

const initialState = {
  courses: [],
  currentCourse: null,
  isLoading: false,
  error: null,
};

export const useCourseAdminStore = create<CourseAdminState>((set, get) => ({
  ...initialState,

  // =====================================================
  // Course Actions
  // =====================================================

  fetchCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      const courses = await courseApi.getAllCourses();
      set({ courses, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取课程列表失败',
        isLoading: false,
      });
    }
  },

  fetchCourse: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const course = await courseApi.getCourse(id);
      set({ currentCourse: course, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取课程详情失败',
        isLoading: false,
      });
    }
  },

  createCourse: async (data: CreateCourseInput) => {
    set({ isLoading: true, error: null });
    try {
      const course = await courseApi.createCourse(data);
      set((state) => ({
        courses: [course, ...state.courses],
        isLoading: false,
      }));
      return course;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '创建课程失败',
        isLoading: false,
      });
      throw error;
    }
  },

  updateCourse: async (id: string, data: UpdateCourseInput) => {
    set({ isLoading: true, error: null });
    try {
      const course = await courseApi.updateCourse(id, data);
      set((state) => ({
        courses: state.courses.map((c) => (c.id === id ? course : c)),
        currentCourse: state.currentCourse?.id === id ? course : state.currentCourse,
        isLoading: false,
      }));
      return course;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新课程失败',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteCourse: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await courseApi.deleteCourse(id);
      set((state) => ({
        courses: state.courses.filter((c) => c.id !== id),
        currentCourse: state.currentCourse?.id === id ? null : state.currentCourse,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除课程失败',
        isLoading: false,
      });
      throw error;
    }
  },

  // =====================================================
  // Main Slide Actions
  // =====================================================

  upsertMainSlide: async (courseId: string, data: UpsertMainSlideInput) => {
    set({ isLoading: true, error: null });
    try {
      const mainSlide = await courseApi.upsertMainSlide(courseId, data);
      set((state) => {
        if (state.currentCourse?.id === courseId) {
          return {
            currentCourse: { ...state.currentCourse, mainSlide },
            isLoading: false,
          };
        }
        return { isLoading: false };
      });
      return mainSlide;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '保存主课件失败',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteMainSlide: async (courseId: string) => {
    set({ isLoading: true, error: null });
    try {
      await courseApi.deleteMainSlide(courseId);
      set((state) => {
        if (state.currentCourse?.id === courseId) {
          return {
            currentCourse: { ...state.currentCourse, mainSlide: undefined },
            isLoading: false,
          };
        }
        return { isLoading: false };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除主课件失败',
        isLoading: false,
      });
      throw error;
    }
  },

  // =====================================================
  // Media Actions
  // =====================================================

  createMedia: async (courseId: string, data: CreateMediaInput) => {
    set({ isLoading: true, error: null });
    try {
      const media = await courseApi.createMedia(courseId, data);
      set((state) => {
        if (state.currentCourse?.id === courseId) {
          return {
            currentCourse: {
              ...state.currentCourse,
              media: [...state.currentCourse.media, media],
            },
            isLoading: false,
          };
        }
        return { isLoading: false };
      });
      return media;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '创建媒体资源失败',
        isLoading: false,
      });
      throw error;
    }
  },

  updateMedia: async (mediaId: string, data: UpdateMediaInput) => {
    set({ isLoading: true, error: null });
    try {
      const media = await courseApi.updateMedia(mediaId, data);
      set((state) => {
        if (state.currentCourse) {
          return {
            currentCourse: {
              ...state.currentCourse,
              media: state.currentCourse.media.map((m) =>
                m.id === mediaId ? media : m
              ),
            },
            isLoading: false,
          };
        }
        return { isLoading: false };
      });
      return media;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新媒体资源失败',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteMedia: async (mediaId: string) => {
    set({ isLoading: true, error: null });
    try {
      await courseApi.deleteMedia(mediaId);
      set((state) => {
        if (state.currentCourse) {
          return {
            currentCourse: {
              ...state.currentCourse,
              media: state.currentCourse.media.filter((m) => m.id !== mediaId),
              hyperlinks: state.currentCourse.hyperlinks.filter(
                (h) => h.targetMediaId !== mediaId
              ),
            },
            isLoading: false,
          };
        }
        return { isLoading: false };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除媒体资源失败',
        isLoading: false,
      });
      throw error;
    }
  },

  reorderMedia: async (courseId: string, mediaIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      await courseApi.reorderMedia(courseId, mediaIds);
      set((state) => {
        if (state.currentCourse?.id === courseId) {
          const mediaMap = new Map(state.currentCourse.media.map((m) => [m.id, m]));
          const reorderedMedia = mediaIds
            .map((id) => mediaMap.get(id))
            .filter((m): m is CourseMedia => !!m)
            .map((m, index) => ({ ...m, sortOrder: index }));
          return {
            currentCourse: { ...state.currentCourse, media: reorderedMedia },
            isLoading: false,
          };
        }
        return { isLoading: false };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '排序媒体资源失败',
        isLoading: false,
      });
      throw error;
    }
  },

  // =====================================================
  // Hyperlink Actions
  // =====================================================

  createHyperlink: async (courseId: string, data: CreateHyperlinkInput) => {
    set({ isLoading: true, error: null });
    try {
      const hyperlink = await courseApi.createHyperlink(courseId, data);
      set((state) => {
        if (state.currentCourse?.id === courseId) {
          return {
            currentCourse: {
              ...state.currentCourse,
              hyperlinks: [...state.currentCourse.hyperlinks, hyperlink],
            },
            isLoading: false,
          };
        }
        return { isLoading: false };
      });
      return hyperlink;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '创建超链接失败',
        isLoading: false,
      });
      throw error;
    }
  },

  updateHyperlink: async (hyperlinkId: string, data: UpdateHyperlinkInput) => {
    set({ isLoading: true, error: null });
    try {
      const hyperlink = await courseApi.updateHyperlink(hyperlinkId, data);
      set((state) => {
        if (state.currentCourse) {
          return {
            currentCourse: {
              ...state.currentCourse,
              hyperlinks: state.currentCourse.hyperlinks.map((h) =>
                h.id === hyperlinkId ? hyperlink : h
              ),
            },
            isLoading: false,
          };
        }
        return { isLoading: false };
      });
      return hyperlink;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新超链接失败',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteHyperlink: async (hyperlinkId: string) => {
    set({ isLoading: true, error: null });
    try {
      await courseApi.deleteHyperlink(hyperlinkId);
      set((state) => {
        if (state.currentCourse) {
          return {
            currentCourse: {
              ...state.currentCourse,
              hyperlinks: state.currentCourse.hyperlinks.filter(
                (h) => h.id !== hyperlinkId
              ),
            },
            isLoading: false,
          };
        }
        return { isLoading: false };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除超链接失败',
        isLoading: false,
      });
      throw error;
    }
  },

  // =====================================================
  // Utility
  // =====================================================

  clearError: () => set({ error: null }),

  reset: () => set(initialState),

  setCurrentCourse: (course: Course | null) => set({ currentCourse: course }),
}));
