/**
 * useExperimentHierarchy - 实验层级数据加载
 *
 * 复用现有的公开单元接口，组装 单元 → 实验 的层级视图模型。
 * 只保留基础知识（foundation）实验，并保持接口返回的排序。
 */

import { useCallback, useEffect, useState } from "react";

import { unitApi } from "@/lib/unit.service";
import { toHierarchyUnits, type HierarchyUnit } from "./experimentHierarchy";

interface UseExperimentHierarchyOptions {
  /** 仅在实验工作台路由下加载（前沿应用路由不需要） */
  enabled: boolean;
  isZh: boolean;
}

export interface ExperimentHierarchyState {
  units: HierarchyUnit[];
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function useExperimentHierarchy({
  enabled,
  isZh,
}: UseExperimentHierarchyOptions): ExperimentHierarchyState {
  const [units, setUnits] = useState<HierarchyUnit[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setUnits([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;

    setIsLoading(true);
    setError(null);

    const loadHierarchy = async () => {
      try {
        const publicUnits = await unitApi.getPublicUnits();
        const entries = await Promise.all(
          publicUnits.map(async (unit) => ({
            unit,
            courses: await unitApi.getPublicUnitCourses(unit.id),
          })),
        );

        if (isCancelled) {
          return;
        }

        setUnits(toHierarchyUnits(entries));
        setIsLoading(false);
      } catch (err) {
        if (isCancelled) {
          return;
        }

        setUnits([]);
        setIsLoading(false);
        setError(
          err instanceof Error && err.message
            ? err.message
            : isZh
              ? "实验目录加载失败"
              : "Failed to load the curriculum",
        );
      }
    };

    void loadHierarchy();

    return () => {
      isCancelled = true;
    };
  }, [enabled, isZh, reloadKey]);

  const retry = useCallback(() => {
    setReloadKey((currentKey) => currentKey + 1);
  }, []);

  return { units, isLoading, error, retry };
}
