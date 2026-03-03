/**
 * Unit Store (Public)
 * 单元 Store (公开)
 *
 * Manages public unit data for display in the units page
 * 管理用于单元页面显示的公开单元数据
 */

import { create } from "zustand";
import { unitApi, Unit, UnitMainSlide, UnitCourse } from "@/lib/unit.service";

interface UnitState {
  units: Unit[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUnits: () => Promise<void>;
  getUnitById: (id: string) => Unit | undefined;
  clearError: () => void;
}

export const useUnitStore = create<UnitState>((set, get) => ({
  units: [],
  isLoading: false,
  error: null,

  fetchUnits: async () => {
    set({ isLoading: true, error: null });
    try {
      const units = await unitApi.getPublicUnits();
      set({ units, isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch units";
      set({ error: message, isLoading: false });
    }
  },

  getUnitById: (id: string) => {
    return get().units.find((u) => u.id === id);
  },

  clearError: () => set({ error: null }),
}));

// =====================================================
// Unit Detail Store (for individual unit page)
// 单元详情 Store (用于单个单元页面)
// =====================================================

interface UnitDetailState {
  unit: Unit | null;
  mainSlide: UnitMainSlide | null;
  courses: UnitCourse[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUnit: (unitId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useUnitDetailStore = create<UnitDetailState>((set) => ({
  unit: null,
  mainSlide: null,
  courses: [],
  isLoading: false,
  error: null,

  fetchUnit: async (unitId: string) => {
    set({ isLoading: true, error: null });
    try {
      const [unit, mainSlide, courses] = await Promise.all([
        unitApi.getPublicUnit(unitId),
        unitApi.getPublicMainSlide(unitId),
        unitApi.getPublicUnitCourses(unitId),
      ]);

      set({
        unit,
        mainSlide,
        courses,
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch unit";
      set({ error: message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
  reset: () =>
    set({
      unit: null,
      mainSlide: null,
      courses: [],
      isLoading: false,
      error: null,
    }),
}));
