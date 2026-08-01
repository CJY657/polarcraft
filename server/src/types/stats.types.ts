/**
 * Public Stats API Type Definitions
 * 公开学习热度 API 类型定义
 */

/** Supported public windows / 公开热度支持的时间窗口 */
export type PublicActivityWindow = '7d' | '30d';

/** One day of the public activity series / 公开热度的单日数据 */
export interface PublicActivityDaily {
  date: string;
  active_learners: number;
  pageviews: number;
  learning_actions: number;
}

/** Aggregate totals for the window / 时间窗口内的汇总 */
export interface PublicActivitySummary {
  active_learners: number;
  pageviews: number;
  learning_actions: number;
}

/** One page of the public 热门页面 list / 公开热门页面 */
export interface PublicActivityPage {
  path: string;
  pageviews: number;
}

/**
 * Internal snapshot: carries the FULL learner list keyed by user id so the
 * public service can compute a viewer's rank. Never leaves the server.
 * 内部快照：含完整学员列表（带 user_id），仅服务端使用，不下发给客户端。
 */
export interface PublicActivitySnapshot {
  status: 'ok' | 'disabled';
  range: { start: string; end: string; days: number };
  generated_at: string;
  summary: PublicActivitySummary | null;
  daily: PublicActivityDaily[];
  top_pages: PublicActivityPage[];
  /** Sorted by events, descending. */
  learners: Array<{
    user_id: string;
    events: number;
    pageviews: number;
    learning_actions: number;
  }>;
}

/** Anonymized learner row on the public leaderboard / 匿名学员榜单行 */
export interface PublicActivityLearner {
  code: string;
  events: number;
  pageviews: number;
  learning_actions: number;
}

/** Public activity response / 公开学习热度响应 */
export interface PublicActivityResponse {
  status: 'ok' | 'disabled';
  window: PublicActivityWindow;
  range: { start: string; end: string; days: number };
  generated_at: string;
  summary: PublicActivitySummary | null;
  daily: PublicActivityDaily[];
  top_pages: PublicActivityPage[];
  top_learners: PublicActivityLearner[];
  /** Present only for signed-in students who appear in the window. */
  viewer: { code: string; rank: number; events: number } | null;
}
