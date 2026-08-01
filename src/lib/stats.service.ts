import { api, unwrapApiData } from './api';

export type PublicActivityWindow = '7d' | '30d';

export interface PublicActivitySummary {
  active_learners: number;
  pageviews: number;
  learning_actions: number;
}

export interface PublicActivityDaily {
  date: string;
  active_learners: number;
  pageviews: number;
  learning_actions: number;
}

export interface PublicActivityLearner {
  /** Anonymous display code, e.g. 3FA2C1 — never a user id or name. */
  code: string;
  events: number;
  pageviews: number;
  learning_actions: number;
}

export interface PublicActivityResponse {
  status: 'ok' | 'disabled';
  window: PublicActivityWindow;
  range: {
    start: string;
    end: string;
    days: number;
  };
  generated_at: string;
  summary: PublicActivitySummary | null;
  daily: PublicActivityDaily[];
  top_pages: Array<{
    path: string;
    pageviews: number;
  }>;
  top_learners: PublicActivityLearner[];
  /** Only present for signed-in students who were active in the window. */
  viewer: {
    code: string;
    rank: number;
    events: number;
  } | null;
}

export const publicStatsApi = {
  async getActivity(window: PublicActivityWindow): Promise<PublicActivityResponse> {
    const response = await api.get<PublicActivityResponse>(
      `/api/stats/activity?window=${window}`
    );
    return unwrapApiData(response, '获取学习热度失败');
  },
};
