/**
 * Quiz Service
 * 测验 API 客户端
 */

import { api, unwrapApiData } from './api';

export type QuizDifficulty = 'basic' | 'intermediate' | 'advanced';
export type QuizAttemptStatus = 'in_progress' | 'completed' | 'expired';

export interface QuizI18nText {
  zh: string;
  en: string;
}

export interface QuizTier {
  id: string;
  label: QuizI18nText;
  minPercent: number;
}

export interface QuizAttemptQuestion {
  questionId: string;
  topic: string;
  difficulty: QuizDifficulty;
  question: QuizI18nText;
  options: QuizI18nText[];
  optionOrder: number[];
}

export interface StartQuizResult {
  attemptId: string;
  total: number;
  durationSeconds: number;
  expiresAt: string;
  personalized: boolean;
  questions: QuizAttemptQuestion[];
}

export interface QuizReviewItem {
  questionId: string;
  topic: string;
  question: QuizI18nText;
  options: QuizI18nText[];
  yourIndex: number | null;
  correctIndex: number;
  isCorrect: boolean;
  explanation: QuizI18nText;
}

export interface SubmitQuizResult {
  attemptId: string;
  score: number;
  total: number;
  percent: number;
  tier: QuizTier;
  durationSeconds: number | null;
  review: QuizReviewItem[];
}

export interface QuizAttemptSummary {
  id: string;
  score: number;
  total: number;
  percent: number;
  tier: string | null;
  status: QuizAttemptStatus;
  completed_at: string | null;
  created_at: string;
}

export interface MyQuizAttemptsResult {
  items: QuizAttemptSummary[];
  tiers: QuizTier[];
}

export interface AdminQuizLearnerRow {
  user_id: string;
  username: string | null;
  nickname: string | null;
  attempts: number;
  best_percent: number;
  best_tier: string | null;
  latest_percent: number;
  latest_tier: string | null;
  latest_at: string | null;
}

export interface AdminQuizListResult {
  items: AdminQuizLearnerRow[];
  total: number;
  tiers: QuizTier[];
}

export interface AdminQuizStats {
  total_attempts: number;
  participants: number;
  average_percent: number;
  pass_rate: number;
  pass_percent: number;
  tier_distribution: Array<{ tier: string; count: number }>;
  tiers: QuizTier[];
}

export interface AdminQuizListParams {
  page?: number;
  pageSize?: number;
  sortBy?: 'best_percent' | 'latest_at' | 'attempts';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export const quizApi = {
  async start(): Promise<StartQuizResult> {
    const response = await api.post<StartQuizResult>('/api/quiz/start');
    return unwrapApiData(response, '开始测验失败');
  },

  async submit(attemptId: string, answers: (number | null)[]): Promise<SubmitQuizResult> {
    const response = await api.post<SubmitQuizResult>(`/api/quiz/${attemptId}/submit`, { answers });
    return unwrapApiData(response, '提交测验失败');
  },

  async getMyAttempts(): Promise<MyQuizAttemptsResult> {
    const response = await api.get<MyQuizAttemptsResult>('/api/quiz/me');
    return unwrapApiData(response, '获取测验记录失败');
  },
};

export const adminQuizApi = {
  async list(params: AdminQuizListParams = {}): Promise<AdminQuizListResult> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.search) query.set('search', params.search);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const response = await api.get<AdminQuizListResult>(`/api/quiz/admin/attempts${suffix}`);
    return unwrapApiData(response, '获取测验成绩失败');
  },

  async stats(): Promise<AdminQuizStats> {
    const response = await api.get<AdminQuizStats>('/api/quiz/admin/stats');
    return unwrapApiData(response, '获取测验统计失败');
  },
};
