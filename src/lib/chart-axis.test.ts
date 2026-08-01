import { describe, expect, it } from 'vitest';

import {
  buildValueAxis,
  formatAxisDay,
  formatAxisValue,
  pickTickIndices,
} from './chart-axis';

describe('buildValueAxis', () => {
  it('rounds the top of the axis up to a readable step', () => {
    expect(buildValueAxis(11)).toEqual({ max: 15, ticks: [0, 5, 10, 15] });
    expect(buildValueAxis(53)).toEqual({ max: 60, ticks: [0, 20, 40, 60] });
    expect(buildValueAxis(9)).toEqual({ max: 10, ticks: [0, 5, 10] });
  });

  it('keeps every tick an integer, so counts never read as fractions', () => {
    for (const value of [1, 2, 3, 7, 24, 96, 137, 2_501, 48_000]) {
      const axis = buildValueAxis(value);
      expect(axis.ticks.every(Number.isInteger)).toBe(true);
      expect(axis.max).toBeGreaterThanOrEqual(value);
      expect(axis.ticks[0]).toBe(0);
      expect(axis.ticks[axis.ticks.length - 1]).toBe(axis.max);
    }
  });

  it('never divides by zero for an all-zero or invalid series', () => {
    expect(buildValueAxis(0)).toEqual({ max: 1, ticks: [0, 1] });
    expect(buildValueAxis(-5)).toEqual({ max: 1, ticks: [0, 1] });
    expect(buildValueAxis(Number.NaN)).toEqual({ max: 1, ticks: [0, 1] });
  });

  it('honours the requested tick density', () => {
    expect(buildValueAxis(100, 2).ticks.length).toBeLessThanOrEqual(4);
    expect(buildValueAxis(100, 5).ticks.length).toBeGreaterThanOrEqual(3);
  });
});

describe('pickTickIndices', () => {
  it('labels every point while they still fit', () => {
    expect(pickTickIndices(4, 6)).toEqual([0, 1, 2, 3]);
  });

  it('thins dense series but always keeps both ends', () => {
    const picked = pickTickIndices(90, 6);
    expect(picked[0]).toBe(0);
    expect(picked[picked.length - 1]).toBe(89);
    expect(picked.length).toBeLessThanOrEqual(6);
    expect([...picked].sort((a, b) => a - b)).toEqual(picked);
  });

  it('handles degenerate series', () => {
    expect(pickTickIndices(0)).toEqual([]);
    expect(pickTickIndices(1)).toEqual([0]);
  });
});

describe('formatAxisValue', () => {
  it('shortens ten-thousands the Chinese way', () => {
    expect(formatAxisValue(0)).toBe('0');
    expect(formatAxisValue(950)).toBe('950');
    expect(formatAxisValue(12_000)).toBe('1.2万');
    expect(formatAxisValue(20_000)).toBe('2万');
  });
});

describe('formatAxisDay', () => {
  it('drops the year and leading zeros', () => {
    expect(formatAxisDay('2026-08-01')).toBe('8/1');
    expect(formatAxisDay('2026-07-31')).toBe('7/31');
  });

  it('passes through anything that is not a date', () => {
    expect(formatAxisDay('unknown')).toBe('unknown');
  });
});
