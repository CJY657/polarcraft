/**
 * useExperimentHierarchy - 实验层级数据加载
 *
 * 复用现有的公开单元接口，组装 单元 → 内容条目 的层级视图模型。
 * 按指定 knowledgeTag 过滤，并保持接口返回的排序。
 */

import { useCallback, useEffect, useState } from "react";

import type { KnowledgeTag } from "@/lib/course.service";
import { unitApi } from "@/lib/unit.service";
import { toHierarchyUnits, type HierarchyUnit } from "./experimentHierarchy";

interface UseExperimentHierarchyOptions {
  /** 仅在层级工作台路由下加载 */
  enabled: boolean;
  isZh: boolean;
  knowledgeTag?: KnowledgeTag;
}

export interface ExperimentHierarchyState {
  units: HierarchyUnit[];
  isLoading: boolean;
  error: string | null;
  loadedKnowledgeTag: KnowledgeTag | null;
  retry: () => void;
}

export function useExperimentHierarchy({
  enabled,
  isZh,
  knowledgeTag = "foundation",
}: UseExperimentHierarchyOptions): ExperimentHierarchyState {
  const [units, setUnits] = useState<HierarchyUnit[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [loadedKnowledgeTag, setLoadedKnowledgeTag] = useState<KnowledgeTag | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setUnits([]);
      setIsLoading(false);
      setError(null);
      setLoadedKnowledgeTag(null);
      return;
    }

    let isCancelled = false;

    setIsLoading(true);
    setError(null);
    setLoadedKnowledgeTag(null);

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

        setUnits(toHierarchyUnits(entries, knowledgeTag));
        setLoadedKnowledgeTag(knowledgeTag);
        setIsLoading(false);
      } catch (err) {
        if (isCancelled) {
          return;
        }

        setUnits([]);
        setLoadedKnowledgeTag(knowledgeTag);
        setIsLoading(false);
        setError(
          err instanceof Error && err.message
            ? err.message
            : knowledgeTag === "optical_device"
              ? isZh
                ? "应用目录加载失败"
                : "Failed to load the application curriculum"
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
  }, [enabled, isZh, knowledgeTag, reloadKey]);

  const retry = useCallback(() => {
    setReloadKey((currentKey) => currentKey + 1);
  }, []);

  return { units, isLoading, error, loadedKnowledgeTag, retry };
}
