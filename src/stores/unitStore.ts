/**
 * Unit Store (Public)
 * 单元 Store (公开)
 *
 * Manages public unit data for display in the units page
 * 管理用于单元页面显示的公开单元数据
 */

import { create } from "zustand";
import { unitApi, Unit } from "@/lib/unit.service";

interface UnitState {
  units: Unit[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUnits: () => Promise<void>;
}

export const useUnitStore = create<UnitState>((set) => ({
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

}));
