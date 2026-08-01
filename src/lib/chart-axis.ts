/**
 * 图表坐标轴辅助 / Axis maths shared by the hand-rolled activity charts.
 *
 * 活动统计的图表各自绘制（CSS 柱状图 / SVG 折线图），这里只提供两件事：
 * 纵轴刻度取整，以及横轴日期取样，让每张图都能标出可读的刻度。
 */

/** 纵轴刻度：0 到 max 的一组整数刻度值。 */
export interface ValueAxis {
  /** 取整后的纵轴顶端，用于把数值缩放成百分比。恒 ≥ 1。 */
  max: number;
  /** 由 0 递增到 max 的刻度值，首尾都包含。 */
  ticks: number[];
}

/** 1 / 2 / 2.5 / 5 / 10 倍率，只接受能落在整数上的步长（活动数据都是计数）。 */
const STEP_MULTIPLIERS = [1, 2, 2.5, 5, 10];

/**
 * 把数据最大值扩到「整数好读」的刻度上。
 * 例：11 → {max: 15, ticks: [0, 5, 10, 15]}；53 → {max: 60, ticks: [0, 20, 40, 60]}。
 */
export function buildValueAxis(maxValue: number, targetTicks = 4): ValueAxis {
  const safeMax = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 0;
  const slots = Math.max(1, Math.round(targetTicks));

  if (safeMax <= 0) {
    return { max: 1, ticks: [0, 1] };
  }

  const rawStep = safeMax / slots;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step =
    STEP_MULTIPLIERS.map((multiplier) => multiplier * magnitude).find(
      (candidate) => candidate >= rawStep && Number.isInteger(candidate)
    ) ?? Math.max(1, Math.ceil(rawStep));

  const max = step * Math.ceil(safeMax / step);
  const ticks: number[] = [];
  for (let value = 0; value <= max; value += step) {
    ticks.push(value);
  }
  return { max, ticks };
}

/**
 * 横轴取样：在 0…count-1 中均匀挑出至多 maxTicks 个下标，首尾必取。
 * 日期太密时只标注这些下标，避免刻度文字互相压叠。
 */
export function pickTickIndices(count: number, maxTicks = 6): number[] {
  if (count <= 0) return [];
  if (count === 1) return [0];

  const limit = Math.max(2, Math.round(maxTicks));
  if (count <= limit) {
    return Array.from({ length: count }, (_, index) => index);
  }

  const picked = new Set<number>();
  for (let slot = 0; slot < limit; slot += 1) {
    picked.add(Math.round((slot * (count - 1)) / (limit - 1)));
  }
  return [...picked].sort((left, right) => left - right);
}

/** 刻度文字：万位以上折成「万」，其余按中文千分位。 */
export function formatAxisValue(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value) >= 10_000) {
    return `${Number((value / 10_000).toFixed(1))}万`;
  }
  return value.toLocaleString('zh-CN');
}

/** 把 2026-08-01 之类的日期压成 8/1，供横轴刻度使用。 */
export function formatAxisDay(date: string): string {
  const [, month, day] = date.split('-');
  if (!month || !day) return date;
  return `${Number(month)}/${Number(day)}`;
}
