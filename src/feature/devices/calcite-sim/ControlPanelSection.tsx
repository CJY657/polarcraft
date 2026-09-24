import type { ReactNode } from 'react';
import type { ISimulationConfig } from './optics';
import { DIM_MIN, DIM_MAX } from './optics';
import { SHAPE_PRESETS, WAVELENGTH_PRESETS, POLARIZATION_PRESETS } from './calcite';
import clsx from 'clsx';

interface ControlPanelSectionProps {
  config: ISimulationConfig;
  onConfigChange: (partial: Partial<ISimulationConfig>) => void;
}

function Group({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-[var(--paper-border)] py-4 first:border-t-0 first:pt-0">
      <h3 className="mb-3 flex items-baseline gap-2 text-[15px] font-semibold text-[var(--paper-foreground)]">
        <span className="font-mono text-xs text-[#d48b1e]">{index}</span>
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Segmented({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-sm transition-colors',
        active
          ? 'border-[var(--paper-foreground)] bg-[var(--paper-foreground)] text-[var(--paper-surface)]'
          : 'border-[var(--paper-border)] text-[var(--paper-muted)] hover:border-[var(--paper-foreground)] hover:text-[var(--paper-foreground)]',
      )}
    >
      {children}
    </button>
  );
}

function Range({
  label,
  value,
  unit = '°',
  digits = 0,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  unit?: string;
  digits?: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm text-[var(--paper-muted)]">
        {label}
        <span className="font-mono tabular-nums text-[var(--paper-foreground)]">
          {value.toFixed(digits)}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[#d48b1e]"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-[var(--paper-foreground)]">
      {label}
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="size-4 shrink-0 accent-[#d48b1e]"
      />
    </label>
  );
}

export default function ControlPanelSection({ config, onConfigChange }: ControlPanelSectionProps) {
  const { wavelengthId, polarization, polarizationAngle, crystalShape, crystalDims, lockDimensions, axisCrystalLock } = config;

  return (
    <div>
      <Group index="01" title="光源与偏振">
        <Segmented>
          {WAVELENGTH_PRESETS.map(w => (
            <Choice key={w.id} active={wavelengthId === w.id} onClick={() => onConfigChange({ wavelengthId: w.id })}>
              <span className="inline-block size-2 rounded-full" style={{ backgroundColor: w.color }} />
              {w.label.split(' ')[0]}
            </Choice>
          ))}
        </Segmented>
        <Segmented>
          {POLARIZATION_PRESETS.map(p => (
            <Choice key={p.id} active={polarization === p.id} onClick={() => onConfigChange({ polarization: p.id })}>
              {p.name}
            </Choice>
          ))}
        </Segmented>
        {polarization === 'linear' && (
          <Range
            label="偏振角（0°=e 光 / 90°=o 光）"
            value={polarizationAngle}
            min={0}
            max={180}
            onChange={v => onConfigChange({ polarizationAngle: v })}
          />
        )}
      </Group>

      <Group index="02" title="入射光方向">
        <Range label="方位角" value={config.incidenceAzimuth} min={0} max={360} onChange={v => onConfigChange({ incidenceAzimuth: v })} />
        <Range label="仰角" value={config.incidenceElevation} min={0} max={90} onChange={v => onConfigChange({ incidenceElevation: v })} />
      </Group>

      <Group index="03" title="光轴方向">
        <Range label="方位角" value={config.opticAxisAzimuth} min={0} max={360} onChange={v => onConfigChange({ opticAxisAzimuth: v })} />
        <Range label="仰角" value={config.opticAxisElevation} min={-90} max={90} onChange={v => onConfigChange({ opticAxisElevation: v })} />
      </Group>

      <Group index="04" title="方解石晶体">
        <Segmented>
          {SHAPE_PRESETS.map(p => (
            <Choice
              key={p.id}
              active={crystalShape === p.shape}
              onClick={() =>
                onConfigChange({
                  crystalShape: p.shape,
                  crystalDims: p.defaultDims,
                  crystalPitch: 0,
                  crystalYaw: 0,
                })
              }
            >
              {p.name}
            </Choice>
          ))}
        </Segmented>
        <Toggle label="锁定比例（等比缩放）" checked={lockDimensions} onChange={v => onConfigChange({ lockDimensions: v })} />
        <div className="grid grid-cols-3 gap-3">
          {(['width', 'height', 'depth'] as const).map(dim => (
            <Range
              key={dim}
              label={dim === 'width' ? '宽' : dim === 'height' ? '高' : '深'}
              value={crystalDims[dim]}
              unit=""
              digits={1}
              min={DIM_MIN}
              max={DIM_MAX}
              step={0.1}
              onChange={v => onConfigChange({ crystalDims: { ...crystalDims, [dim]: v } })}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Range label="俯仰" value={config.crystalPitch} min={-60} max={60} onChange={v => onConfigChange({ crystalPitch: v })} />
          <Range label="偏航" value={config.crystalYaw} min={-180} max={180} onChange={v => onConfigChange({ crystalYaw: v })} />
        </div>
        <Toggle
          label="光轴与晶体联动（晶体旋转带动光轴）"
          checked={axisCrystalLock}
          onChange={v => onConfigChange({ axisCrystalLock: v })}
        />
        {axisCrystalLock && <p className="text-sm text-[var(--paper-muted)]">已锁定：旋转晶体即可带动光轴同步旋转</p>}
      </Group>

      <Group index="05" title="显示">
        <Toggle label="光轴方向线" checked={config.showOpticAxis} onChange={v => onConfigChange({ showOpticAxis: v })} />
        <Toggle label="出射光轨迹" checked={config.showExitRays} onChange={v => onConfigChange({ showExitRays: v })} />
        <Toggle label="偏振标记（点 / 横线）" checked={config.showPolarization} onChange={v => onConfigChange({ showPolarization: v })} />
        <Toggle label="流光动画" checked={config.showAnimation} onChange={v => onConfigChange({ showAnimation: v })} />
        <Toggle label="地面网格" checked={config.showGrid} onChange={v => onConfigChange({ showGrid: v })} />
        <Toggle label="文字标签" checked={config.showLabels} onChange={v => onConfigChange({ showLabels: v })} />
      </Group>
    </div>
  );
}
