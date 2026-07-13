/**
 * Quiz Types
 * 测验类型
 *
 * Polarization proficiency quiz — server-side question bank and attempt records.
 * 偏振知识测验 —— 服务端题库与作答记录。
 */

export type QuizDifficulty = 'basic' | 'intermediate' | 'advanced';

export type QuizAttemptStatus = 'in_progress' | 'completed' | 'expired';

/**
 * Bilingual text, matching the src/data/*.ts convention.
 * 双语文本，与 src/data/*.ts 约定保持一致。
 */
export interface QuizI18nText {
  zh: string;
  en: string;
}

/**
 * A single-choice question in the server-side bank.
 * Correct answer + explanation never leave the server until grading.
 * 服务端题库中的单选题。正确答案与解析在评分前绝不下发客户端。
 */
export interface QuizQuestion {
  id: string;
  topic: string;
  difficulty: QuizDifficulty;
  question: QuizI18nText;
  options: QuizI18nText[];
  answerIndex: number;
  explanation: QuizI18nText;
}

/**
 * Rating tier awarded on completion, Bilibili-entry-quiz style.
 * 完成后授予的评级称号，参考 B 站入站测试风格。
 */
export interface QuizTier {
  id: string;
  label: QuizI18nText;
  minPercent: number;
}

/**
 * A question as delivered to the client for one attempt: no answer, options
 * pre-shuffled. `optionOrder[displayIndex] = canonicalIndex` maps a clicked
 * option back to the bank's canonical order for grading.
 * 下发给客户端的题目：不含答案、选项已打乱。optionOrder 将展示序号映射回题库原始序号用于评分。
 */
export interface QuizAttemptQuestion {
  questionId: string;
  topic: string;
  difficulty: QuizDifficulty;
  question: QuizI18nText;
  options: QuizI18nText[];
  optionOrder: number[];
}

/**
 * Persisted attempt document (collection: quiz_attempts).
 * 持久化的作答文档（集合：quiz_attempts）。
 */
export interface QuizAttempt {
  id: string;
  user_id: string;
  question_ids: string[];
  option_orders: number[][];
  answers: (number | null)[];
  score: number;
  total: number;
  percent: number;
  tier: string | null;
  status: QuizAttemptStatus;
  started_at: Date;
  completed_at: Date | null;
  duration_seconds: number | null;
  expires_at: Date;
  personalized: boolean;
  created_at: Date;
}

/**
 * Per-question feedback returned after grading.
 * 评分后返回的逐题反馈。
 */
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

export interface StartQuizResult {
  attemptId: string;
  total: number;
  durationSeconds: number;
  expiresAt: string;
  personalized: boolean;
  questions: QuizAttemptQuestion[];
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

/**
 * Attempt summary for the current user's history.
 * 当前用户历史记录的作答摘要。
 */
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

/**
 * Admin: one row per student, aggregated across their attempts.
 * 管理端：每位学生一行，跨其所有作答聚合。
 */
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
}

export interface AdminQuizStats {
  total_attempts: number;
  participants: number;
  average_percent: number;
  pass_rate: number;
  tier_distribution: Array<{ tier: string; count: number }>;
}
