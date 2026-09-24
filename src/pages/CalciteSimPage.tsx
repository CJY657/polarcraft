import { useCallback, useMemo, useState } from 'react';
import { Vector3 } from 'three';
import clsx from 'clsx';
import { RotateCcw } from 'lucide-react';
import { PersistentHeader } from '@/components/shared';
import { DevicesWorkspaceLayout } from '@/feature/devices/DevicesWorkspaceLayout';
import SimulationViewportSection from '@/feature/devices/calcite-sim/SimulationViewportSection';
import ControlPanelSection from '@/feature/devices/calcite-sim/ControlPanelSection';
import { ReadoutSection, TheorySection } from '@/feature/devices/calcite-sim/ReadoutSection';
import {
  DEFAULT_CONFIG,
  SCENE_PRESETS,
  DIM_MIN,
  DIM_MAX,
  crystalOrientation,
  directionFromAngles,
  anglesFromDirection,
  computeRefraction,
  type ISimulationConfig,
} from '@/feature/devices/calcite-sim/optics';
import { buildCrystal, type CrystalDims } from '@/feature/devices/calcite-sim/crystal';
import type { IScenePreset } from '@/feature/devices/calcite-sim/optics';

export default function CalciteSimPage() {
  const [config, setConfig] = useState<ISimulationConfig>(DEFAULT_CONFIG);
  const [activePreset, setActivePreset] = useState<string | null>('classic');
  const [viewResetToken, setViewResetToken] = useState(0);

  const handleConfigChange = useCallback((partial: Partial<ISimulationConfig>) => {
    setConfig(prev => {
      const next: ISimulationConfig = { ...prev, ...partial };

      // 比例锁定：改任一维度 → 等比缩放其他维度
      if (partial.crystalDims && next.lockDimensions) {
        const keys = ['width', 'height', 'depth'] as const;
        const changed = keys.find(k => partial.crystalDims![k] !== prev.crystalDims[k]);
        if (changed) {
          const scale = partial.crystalDims![changed] / prev.crystalDims[changed];
          next.crystalDims = keys.reduce((acc, k) => {
            acc[k] = Math.min(DIM_MAX, Math.max(DIM_MIN, prev.crystalDims[k] * scale));
            return acc;
          }, {} as CrystalDims);
        }
      }

      // 光轴-晶体锁定切换：晶体旋转 → 光轴跟随旋转（保存锁定时刻的光轴方向）
      if (partial.axisCrystalLock !== undefined) {
        if (partial.axisCrystalLock) {
          // 锁定：捕获当前光轴世界方向，供后续计算旋转增量时作为基准
          const axDir = directionFromAngles(prev.opticAxisAzimuth, prev.opticAxisElevation);
          next.lockedOpticDirection = [axDir.x, axDir.y, axDir.z];
        } else if (prev.axisCrystalLock) {
          // 解锁：清除基准，晶体俯仰/偏航滑杆仍由 prev.crystalPitch / prev.crystalYaw 控制
          next.lockedOpticDirection = null;
        }
      }

      // 锁定时：晶体俯仰/偏航变化 → 光轴按同样的增量四元数跟随旋转（反向于之前实现）
      const crystalOrientChanged =
        partial.crystalPitch !== undefined || partial.crystalYaw !== undefined;
      if (crystalOrientChanged && next.axisCrystalLock && next.lockedOpticDirection) {
        const prevOrient = crystalOrientation(prev);
        const nextOrient = crystalOrientation(next);
        const delta = nextOrient.clone().multiply(prevOrient.clone().invert());
        const baseDir = new Vector3(...next.lockedOpticDirection);
        const newDir = baseDir.clone().applyQuaternion(delta);
        const { azimuth, elevation } = anglesFromDirection(newDir);
        next.opticAxisAzimuth = Math.round(azimuth);
        next.opticAxisElevation = Math.round(elevation);
        next.lockedOpticDirection = [newDir.x, newDir.y, newDir.z];
      }

      // 光轴拖动时（即便锁着）不改变晶体姿态，只更新基准方向避免下一帧跳变
      const axisDragged =
        partial.opticAxisAzimuth !== undefined || partial.opticAxisElevation !== undefined;
      if (axisDragged && next.axisCrystalLock) {
        const axDir = directionFromAngles(next.opticAxisAzimuth, next.opticAxisElevation);
        next.lockedOpticDirection = [axDir.x, axDir.y, axDir.z];
      }

      return next;
    });
    setActivePreset(null);
  }, []);

  const handlePresetSelect = useCallback((preset: IScenePreset) => {
    setConfig(prev => ({
      ...prev,
      ...preset.config,
      axisCrystalLock: false,
      lockedOpticDirection: null,
    }));
    setActivePreset(preset.id);
  }, []);

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setActivePreset('classic');
    setViewResetToken(t => t + 1);
  }, []);

  const orientation = useMemo(() => crystalOrientation(config), [config]);
  const polyhedron = useMemo(
    () => buildCrystal(config.crystalShape, config.crystalDims, orientation),
    [config.crystalShape, config.crystalDims, orientation],
  );
  const result = useMemo(() => computeRefraction(config, polyhedron), [config, polyhedron]);

  return (
    <div className="glass-page min-h-screen text-[var(--paper-foreground)]">
      <PersistentHeader moduleKey="devices" moduleName="偏振挑战" variant="solid" compact className="sticky top-0 z-40" />

      <DevicesWorkspaceLayout>

      <div className="mx-auto max-w-[1600px] px-4 pb-16 pt-5 md:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">方解石双折射虚拟仿真</h1>
            <p className="mt-1 max-w-2xl text-[15px] text-[var(--paper-muted)]">
              拖动入射光与光轴方向，调节晶体形状、波长与偏振态，实时观察 o 光 / e 光路径
            </p>
          </div>
          <nav aria-label="场景预设" className="flex flex-wrap items-center gap-1 text-sm">
            {SCENE_PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                title={preset.description}
                aria-pressed={activePreset === preset.id}
                className={clsx(
                  'border-b-2 px-2.5 py-1.5 transition-colors',
                  activePreset === preset.id
                    ? 'border-[#d48b1e] font-semibold text-[var(--paper-foreground)]'
                    : 'border-transparent text-[var(--paper-muted)] hover:text-[var(--paper-foreground)]',
                )}
              >
                {preset.name}
              </button>
            ))}
            <button
              type="button"
              onClick={handleReset}
              className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[var(--paper-muted)] hover:text-[var(--paper-foreground)]"
            >
              <RotateCcw className="size-4" />
              重置
            </button>
          </nav>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-64px-2rem)]">
            <SimulationViewportSection
              config={config}
              polyhedron={polyhedron}
              result={result}
              onConfigChange={handleConfigChange}
              resetToken={viewResetToken}
            />
          </div>
          <ControlPanelSection config={config} onConfigChange={handleConfigChange} />
        </div>

        <div className="mt-8">
          <ReadoutSection config={config} result={result} />
        </div>

        <div className="mt-10">
          <TheorySection />
        </div>
      </div>
      </DevicesWorkspaceLayout>
    </div>
  );
}
