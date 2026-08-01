/**
 * Activity date-range parsing
 * 统计区间解析（管理端与公开热度页共用）
 */

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type ActivityDateRange = { start: string; end: string };

function toUtcDate(value: string): number {
  return Date.parse(`${value}T00:00:00Z`);
}

/**
 * Resolve a YYYY-MM-DD range from the query string, falling back to the last
 * `defaultDays` days ending today. Returns an error message on invalid input.
 */
export function resolveActivityDateRange(
  start: unknown,
  end: unknown,
  options: { defaultDays: number; maxSpanDays: number }
): ActivityDateRange | { error: string } {
  const todayTs = toUtcDate(new Date().toISOString().slice(0, 10));

  if (start === undefined && end === undefined) {
    return {
      start: new Date(todayTs - (options.defaultDays - 1) * 86_400_000)
        .toISOString()
        .slice(0, 10),
      end: new Date(todayTs).toISOString().slice(0, 10),
    };
  }

  if (
    typeof start !== 'string' ||
    typeof end !== 'string' ||
    !DATE_PATTERN.test(start) ||
    !DATE_PATTERN.test(end)
  ) {
    return { error: '起止日期需同时提供，格式为 YYYY-MM-DD' };
  }

  const startTs = toUtcDate(start);
  const endTs = toUtcDate(end);
  if (Number.isNaN(startTs) || Number.isNaN(endTs)) {
    return { error: '起止日期无效' };
  }
  if (startTs > endTs) {
    return { error: '开始日期不能晚于结束日期' };
  }
  if (endTs > todayTs) {
    return { error: '结束日期不能晚于今天' };
  }
  if ((endTs - startTs) / 86_400_000 + 1 > options.maxSpanDays) {
    return { error: `时间跨度不能超过 ${options.maxSpanDays} 天` };
  }

  return { start, end };
}
