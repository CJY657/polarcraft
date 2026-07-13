/**
 * Quiz Configuration & Selection Logic
 * 测验配置与选题逻辑
 */

import type {
  QuizAttempt,
  QuizDifficulty,
  QuizQuestion,
  QuizTier,
} from '../types/quiz.types.js';

/** Number of questions drawn per attempt. 每次作答抽取的题目数量。 */
export const QUIZ_QUESTION_COUNT = 20;

/** Attempt time limit in seconds (25 minutes). 作答时限（秒），25 分钟。 */
export const QUIZ_DURATION_SECONDS = 25 * 60;

/** Difficulty mix per attempt (must sum to QUIZ_QUESTION_COUNT). 每次作答的难度配比（总和须等于题量）。 */
export const QUIZ_DIFFICULTY_MIX: Record<QuizDifficulty, number> = {
  basic: 6,
  intermediate: 9,
  advanced: 5,
};

/** Passing threshold (percent). 及格线（百分比）。 */
export const QUIZ_PASS_PERCENT = 60;

/**
 * Rating tiers, ascending by minPercent. 评级称号，按 minPercent 升序。
 */
export const QUIZ_TIERS: QuizTier[] = [
  { id: 'novice', label: { zh: '偏振新手', en: 'Polarization Novice' }, minPercent: 0 },
  { id: 'apprentice', label: { zh: '初窥门径', en: 'Apprentice' }, minPercent: 40 },
  { id: 'adept', label: { zh: '登堂入室', en: 'Adept' }, minPercent: 60 },
  { id: 'expert', label: { zh: '融会贯通', en: 'Expert' }, minPercent: 75 },
  { id: 'master', label: { zh: '偏振大师', en: 'Polarization Master' }, minPercent: 90 },
];

/**
 * Resolve a percent score to its tier.
 * 将百分比得分解析为对应的评级称号。
 */
export function tierForPercent(percent: number): QuizTier {
  let resolved = QUIZ_TIERS[0];
  for (const tier of QUIZ_TIERS) {
    if (percent >= tier.minPercent) {
      resolved = tier;
    }
  }
  return resolved;
}

/**
 * Deterministic-free Fisher–Yates shuffle returning a new array.
 * Fisher–Yates 洗牌，返回新数组。
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Weighted random draw of `count` distinct items. Each item's weight biases how
 * likely it is to be picked; items already chosen are removed from the pool.
 * 加权无放回抽样，抽取 count 个不同的题目；权重越大越可能被抽中。
 */
function weightedSample(
  pool: QuizQuestion[],
  weightOf: (q: QuizQuestion) => number,
  count: number
): QuizQuestion[] {
  const remaining = [...pool];
  const picked: QuizQuestion[] = [];

  while (picked.length < count && remaining.length > 0) {
    const weights = remaining.map((q) => Math.max(weightOf(q), 0.0001));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let threshold = Math.random() * totalWeight;

    let index = 0;
    for (; index < remaining.length; index += 1) {
      threshold -= weights[index];
      if (threshold <= 0) {
        break;
      }
    }

    const [chosen] = remaining.splice(Math.min(index, remaining.length - 1), 1);
    picked.push(chosen);
  }

  return picked;
}

/**
 * Compute a per-topic error rate from a student's past completed attempts.
 * Higher = the student got that topic wrong more often. Empty when no history.
 * 根据学生过往已完成的作答计算各知识点错误率；错误越多值越高，无历史时为空。
 */
export function topicErrorRates(
  pastAttempts: QuizAttempt[],
  bank: QuizQuestion[]
): Map<string, number> {
  const byId = new Map(bank.map((q) => [q.id, q]));
  const seen = new Map<string, number>();
  const wrong = new Map<string, number>();

  for (const attempt of pastAttempts) {
    if (attempt.status !== 'completed') {
      continue;
    }
    attempt.question_ids.forEach((questionId, position) => {
      const question = byId.get(questionId);
      if (!question) {
        return;
      }
      const order = attempt.option_orders[position];
      const displayAnswer = attempt.answers[position];
      const canonicalAnswer =
        order && typeof displayAnswer === 'number' ? order[displayAnswer] : null;

      seen.set(question.topic, (seen.get(question.topic) ?? 0) + 1);
      if (canonicalAnswer !== question.answerIndex) {
        wrong.set(question.topic, (wrong.get(question.topic) ?? 0) + 1);
      }
    });
  }

  const rates = new Map<string, number>();
  for (const [topic, total] of seen) {
    rates.set(topic, total > 0 ? (wrong.get(topic) ?? 0) / total : 0);
  }
  return rates;
}

/**
 * Select the questions for one attempt: difficulty-stratified, and — when the
 * student has history — biased toward topics they've previously struggled with
 * (weight `1 + errorRate`). Pure aside from Math.random; unit-testable.
 * 为一次作答选题：按难度分层，并在有历史时向薄弱知识点倾斜（权重 1 + 错误率）。
 */
export function pickQuestions(
  bank: QuizQuestion[],
  pastAttempts: QuizAttempt[]
): QuizQuestion[] {
  const errorRates = topicErrorRates(pastAttempts, bank);
  const weightOf = (q: QuizQuestion) => 1 + (errorRates.get(q.topic) ?? 0);

  const selected: QuizQuestion[] = [];

  (Object.keys(QUIZ_DIFFICULTY_MIX) as QuizDifficulty[]).forEach((difficulty) => {
    const target = QUIZ_DIFFICULTY_MIX[difficulty];
    const pool = bank.filter((q) => q.difficulty === difficulty);
    selected.push(...weightedSample(pool, weightOf, target));
  });

  // Top up from the remaining bank if any difficulty pool was short.
  // 若某一难度题量不足，则从剩余题库补足。
  if (selected.length < QUIZ_QUESTION_COUNT) {
    const chosenIds = new Set(selected.map((q) => q.id));
    const rest = bank.filter((q) => !chosenIds.has(q.id));
    selected.push(
      ...weightedSample(rest, weightOf, QUIZ_QUESTION_COUNT - selected.length)
    );
  }

  return shuffle(selected).slice(0, QUIZ_QUESTION_COUNT);
}

/**
 * Whether the draw was personalized (i.e. the student had prior completed data).
 * 本次抽题是否为个性化（即学生存在过往已完成数据）。
 */
export function hasPersonalizationSignal(pastAttempts: QuizAttempt[]): boolean {
  return pastAttempts.some((attempt) => attempt.status === 'completed');
}
