/**
 * Profile Store
 * 个人资料状态管理
 */

import { create } from 'zustand';
import {
  profileApi,
  UserEducation,
  CreateEducationInput,
  UpdateEducationInput,
  ProjectApplication,
  PublicProject,
} from '@/lib/profile.service';

interface ProfileState {
  // State
  educations: UserEducation[];
  applications: ProjectApplication[];
  publicProjects: PublicProject[];
  isLoading: boolean;
  error: string | null;

  // Education Actions
  fetchEducations: () => Promise<void>;
  addEducation: (data: CreateEducationInput) => Promise<UserEducation>;
  updateEducation: (id: string, data: UpdateEducationInput) => Promise<UserEducation>;
  deleteEducation: (id: string) => Promise<void>;
  // Application Actions
  fetchApplications: () => Promise<void>;
  withdrawApplication: (id: string) => Promise<void>;
  // Public Projects Actions
  fetchPublicProjects: (filters?: { recruiting?: boolean; search?: string }) => Promise<void>;
  // Utility
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  educations: [],
  applications: [],
  publicProjects: [],
  isLoading: false,
  error: null,
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  ...initialState,

  // =====================================================
  // Education Actions
  // =====================================================

  fetchEducations: async () => {
    set({ isLoading: true, error: null });
    try {
      const educations = await profileApi.getUserEducations();
      set({ educations, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取教育经历失败',
        isLoading: false,
      });
    }
  },

  addEducation: async (data: CreateEducationInput) => {
    set({ isLoading: true, error: null });
    try {
      const education = await profileApi.createEducation(data);
      set((state) => ({
        educations: [...state.educations, education].sort(
          (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        ),
        isLoading: false,
      }));
      return education;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '创建教育经历失败',
        isLoading: false,
      });
      throw error;
    }
  },

  updateEducation: async (id: string, data: UpdateEducationInput) => {
    set({ isLoading: true, error: null });
    try {
      const education = await profileApi.updateEducation(id, data);
      set((state) => ({
        educations: state.educations
          .map((e) => (e.id === id ? education : e))
          .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()),
        isLoading: false,
      }));
      return education;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新教育经历失败',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteEducation: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await profileApi.deleteEducation(id);
      set((state) => ({
        educations: state.educations.filter((e) => e.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除教育经历失败',
        isLoading: false,
      });
      throw error;
    }
  },

  // =====================================================
  // Application Actions
  // =====================================================

  fetchApplications: async () => {
    set({ isLoading: true, error: null });
    try {
      const applications = await profileApi.getUserApplications();
      set({ applications, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取申请列表失败',
        isLoading: false,
      });
    }
  },

  withdrawApplication: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await profileApi.withdrawApplication(id);
      set((state) => ({
        applications: state.applications.map((a) =>
          a.id === id ? { ...a, status: 'withdrawn' as const } : a
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '撤回申请失败',
        isLoading: false,
      });
      throw error;
    }
  },

  // =====================================================
  // Public Projects Actions
  // =====================================================

  fetchPublicProjects: async (filters?: { recruiting?: boolean; search?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const publicProjects = await profileApi.getPublicProjects(filters);
      set({ publicProjects, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取公开项目失败',
        isLoading: false,
      });
    }
  },

  // =====================================================
  // Utility
  // =====================================================

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
