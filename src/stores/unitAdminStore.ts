/**
 * Unit Admin Store
 * 单元管理状态管理
 */

import { create } from "zustand";
import {
  unitApi,
  Unit,
  UnitMainSlide,
  CreateUnitInput,
  UpdateUnitInput,
  UpsertUnitMainSlideInput,
} from "@/lib/unit.service";

interface UnitAdminState {
  // State
  units: Unit[];
  currentUnit: Unit | null;
  isLoading: boolean;
  error: string | null;

  // Unit Actions
  fetchUnits: () => Promise<void>;
  fetchUnit: (id: string) => Promise<void>;
  createUnit: (data: CreateUnitInput) => Promise<Unit>;
  updateUnit: (id: string, data: UpdateUnitInput) => Promise<Unit>;
  deleteUnit: (id: string) => Promise<void>;
  reorderUnits: (unitIds: string[]) => Promise<void>;

  // Main Slide Actions
  upsertMainSlide: (unitId: string, data: UpsertUnitMainSlideInput) => Promise<UnitMainSlide>;
  deleteMainSlide: (unitId: string) => Promise<void>;

  // Utility
  clearError: () => void;
  reset: () => void;
  setCurrentUnit: (unit: Unit | null) => void;
}

const initialState = {
  units: [],
  currentUnit: null,
  isLoading: false,
  error: null,
};

export const useUnitAdminStore = create<UnitAdminState>((set, get) => ({
  ...initialState,

  // =====================================================
  // Unit Actions
  // =====================================================

  fetchUnits: async () => {
    set({ isLoading: true, error: null });
    try {
      const units = await unitApi.getAllUnits();
      set({ units, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "获取单元列表失败",
        isLoading: false,
      });
    }
  },

  fetchUnit: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const unit = await unitApi.getUnit(id);
      set({ currentUnit: unit, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "获取单元详情失败",
        isLoading: false,
      });
    }
  },

  createUnit: async (data: CreateUnitInput) => {
    set({ isLoading: true, error: null });
    try {
      const unit = await unitApi.createUnit(data);
      set((state) => ({
        units: [unit, ...state.units],
        isLoading: false,
      }));
      return unit;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "创建单元失败",
        isLoading: false,
      });
      throw error;
    }
  },

  updateUnit: async (id: string, data: UpdateUnitInput) => {
    set({ isLoading: true, error: null });
    try {
      const unit = await unitApi.updateUnit(id, data);
      set((state) => ({
        units: state.units.map((u) => (u.id === id ? unit : u)),
        currentUnit: state.currentUnit?.id === id ? unit : state.currentUnit,
        isLoading: false,
      }));
      return unit;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "更新单元失败",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteUnit: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await unitApi.deleteUnit(id);
      set((state) => ({
        units: state.units.filter((u) => u.id !== id),
        currentUnit: state.currentUnit?.id === id ? null : state.currentUnit,
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "删除单元失败",
        isLoading: false,
      });
      throw error;
    }
  },

  reorderUnits: async (unitIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      await unitApi.reorderUnits(unitIds);
      set((state) => {
        const unitMap = new Map(state.units.map((u) => [u.id, u]));
        const reorderedUnits = unitIds
          .map((id) => unitMap.get(id))
          .filter((u): u is Unit => !!u)
          .map((u, index) => ({ ...u, sortOrder: index }));
        return { units: reorderedUnits, isLoading: false };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "排序单元失败",
        isLoading: false,
      });
      throw error;
    }
  },

  // =====================================================
  // Main Slide Actions
  // =====================================================

  upsertMainSlide: async (unitId: string, data: UpsertUnitMainSlideInput) => {
    set({ isLoading: true, error: null });
    try {
      const mainSlide = await unitApi.upsertMainSlide(unitId, data);
      set((state) => {
        if (state.currentUnit?.id === unitId) {
          return {
            currentUnit: { ...state.currentUnit, mainSlide },
            isLoading: false,
          };
        }
        return { isLoading: false };
      });
      return mainSlide;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "保存主课件失败",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteMainSlide: async (unitId: string) => {
    set({ isLoading: true, error: null });
    try {
      await unitApi.deleteMainSlide(unitId);
      set((state) => {
        if (state.currentUnit?.id === unitId) {
          return {
            currentUnit: { ...state.currentUnit, mainSlide: undefined },
            isLoading: false,
          };
        }
        return { isLoading: false };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "删除主课件失败",
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

  setCurrentUnit: (unit: Unit | null) => set({ currentUnit: unit }),
}));
