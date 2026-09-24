import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, crystalOrientation, computeRefraction, type ISimulationConfig } from './optics';
import { buildCrystal } from './crystal';
import { WAVELENGTH_PRESETS } from './calcite';

const run = (config: ISimulationConfig) =>
  computeRefraction(config, buildCrystal(config.crystalShape, config.crystalDims, crystalOrientation(config)));

describe('calcite optics', () => {
  it('uses calcite indices at 589nm', () => {
    expect(WAVELENGTH_PRESETS[0].nO).toBeCloseTo(1.658, 3);
    expect(WAVELENGTH_PRESETS[0].nE).toBeCloseTo(1.486, 3);
  });

  it('splits o and e in the default oblique scene', () => {
    const r = run(DEFAULT_CONFIG);
    expect(r.hit).toBe(true);
    expect(r.oRefractionAngle).not.toBeCloseTo(r.eRefractionAngle, 1);
  });
});
