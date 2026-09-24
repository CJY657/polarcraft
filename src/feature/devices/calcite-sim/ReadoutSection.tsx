import type { ReactNode } from 'react';
import type { ISimulationConfig, IRefractionResult } from './optics';
import { WAVELENGTH_PRESETS, THEORY_CONTENT, CALCITE_CONSTANTS } from './calcite';

const O_COLOR = '#c98a14';
const E_COLOR = '#8a3fc4';

function Cell({ label, children, color }: { label: ReactNode; children: ReactNode; color?: string }) {
  return (
    <div className="px-4 py-3">
      <dt className="text-sm text-[var(--paper-muted)]">{label}</dt>
      <dd className="mt-0.5 font-mono text-lg tabular-nums text-[var(--paper-foreground)]" style={color ? { color } : undefined}>
        {children}
      </dd>
    </div>
  );
}

export function ReadoutSection({ config, result }: { config: ISimulationConfig; result: IRefractionResult }) {
  const pol = result.polarization ?? { oIntensity: 0, eIntensity: 0 };
  const wavelength = result.wavelength ?? WAVELENGTH_PRESETS[0];
  const tir = result.totalInternalReflection ?? { o: false, e: false };
  const nO = wavelength.nO;
  const nE = wavelength.nE;
  const deg = (v: number) => (result.hit ? `${v.toFixed(1)}°` : '—');
  const pct = (v: number) => (result.hit ? `${(v * 100).toFixed(0)}%` : '—');

  return (
    <section>
      <h2 className="mb-2 text-sm text-[var(--paper-muted)]">实时读数 · {wavelength.label}</h2>
      <dl className="grid grid-cols-2 divide-x divide-y divide-[var(--paper-border)] border border-[var(--paper-border)] sm:grid-cols-3 lg:grid-cols-5">
        <Cell label="入射角">{deg(result.incidenceAngle)}</Cell>
        <Cell label="o 光折射角" color={O_COLOR}>{deg(result.oRefractionAngle)}</Cell>
        <Cell label="e 光折射角" color={E_COLOR}>{deg(result.eRefractionAngle)}</Cell>
        <Cell label="分离角">{deg(result.separationAngle)}</Cell>
        <Cell label="入射偏振">
          <span className="font-sans text-base">
            {config.polarization === 'natural'
              ? '自然光'
              : config.polarization === 'linear'
                ? `线偏振 ${config.polarizationAngle}°`
                : '圆偏振'}
          </span>
        </Cell>
        <Cell label={<>n<sub>o</sub></>}>{nO.toFixed(4)}</Cell>
        <Cell label={<>n<sub>e</sub></>}>{nE.toFixed(4)}</Cell>
        <Cell label={<>Δn = n<sub>o</sub> − n<sub>e</sub></>}>{(nO - nE).toFixed(4)}</Cell>
        <Cell label="出射 o 光强度（相对入射）" color={O_COLOR}>{pct(pol.oIntensity)}</Cell>
        <Cell label="出射 e 光强度（相对入射）" color={E_COLOR}>{pct(pol.eIntensity)}</Cell>
      </dl>
      {(tir.o || tir.e) && (
        <p className="mt-2 text-sm font-semibold text-[#c2410c]">
          全内反射：{[tir.o && 'o 光', tir.e && 'e 光'].filter(Boolean).join('、')}
        </p>
      )}
    </section>
  );
}

// ponytail: 原 MOCK_THEORY_SECTIONS 三条与 THEORY_CONTENT 重复，已去掉
export function TheorySection() {
  return (
    <details className="group border-t border-[var(--paper-border)] pt-4">
      <summary className="cursor-pointer list-none text-lg font-semibold text-[var(--paper-foreground)]">
        {THEORY_CONTENT.title}
        <span className="ml-2 text-sm font-normal text-[var(--paper-muted)] group-open:hidden">展开</span>
      </summary>
      <div className="mt-4 grid gap-x-10 gap-y-5 md:grid-cols-2">
        {THEORY_CONTENT.sections.map(sec => (
          <div key={sec.heading}>
            <h3 className="mb-1 text-base font-semibold text-[var(--paper-foreground)]">{sec.heading}</h3>
            <p className="text-[15px] leading-relaxed text-[var(--paper-muted)]">{sec.body}</p>
          </div>
        ))}
        <div className="border-l-2 border-[#d48b1e] pl-4 md:col-span-2">
          <h3 className="mb-1 text-base font-semibold text-[var(--paper-foreground)]">冰洲石激光演示</h3>
          <p className="text-[15px] leading-relaxed text-[var(--paper-muted)]">
            让激光束穿过冰洲石晶体，可在屏上观察到两个光点——分别对应 o 光与 e
            光。旋转晶体时，其中一个光点绕另一个转动，直观展示了各向异性介质中折射率随方向变化的特性。
            （参考：{CALCITE_CONSTANTS.wavelength}）
          </p>
        </div>
      </div>
    </details>
  );
}
