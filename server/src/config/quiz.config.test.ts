import { describe, expect, it } from 'vitest';
import {
  QUIZ_DIFFICULTY_MIX,
  QUIZ_QUESTION_COUNT,
  QUIZ_TIERS,
  hasPersonalizationSignal,
  pickQuestions,
  shuffle,
  tierForPercent,
  topicErrorRates,
} from './quiz.config.js';
import { QUIZ_BANK } from '../data/quiz-bank.js';
import type { QuizAttempt } from '../types/quiz.types.js';

function completedAttempt(
  questionIds: string[],
  canonicalAnswers: (number | null)[],
): QuizAttempt {
  // Identity option order so canonical answers map straight through.
  const identityOrder = [0, 1, 2, 3];
  return {
    id: 'attempt-1',
    user_id: 'user-1',
    question_ids: questionIds,
    option_orders: questionIds.map(() => identityOrder),
    answers: canonicalAnswers,
    score: 0,
    total: questionIds.length,
    percent: 0,
    tier: null,
    status: 'completed',
    started_at: new Date(),
    completed_at: new Date(),
    duration_seconds: 60,
    expires_at: new Date(),
    personalized: false,
    created_at: new Date(),
  };
}

describe('tierForPercent', () => {
  it('maps boundary scores to the expected tiers', () => {
    expect(tierForPercent(0).id).toBe('novice');
    expect(tierForPercent(39).id).toBe('novice');
    expect(tierForPercent(40).id).toBe('apprentice');
    expect(tierForPercent(60).id).toBe('adept');
    expect(tierForPercent(75).id).toBe('expert');
    expect(tierForPercent(89).id).toBe('expert');
    expect(tierForPercent(90).id).toBe('master');
    expect(tierForPercent(100).id).toBe('master');
  });

  it('has ascending, non-overlapping tier thresholds', () => {
    const thresholds = QUIZ_TIERS.map((tier) => tier.minPercent);
    expect(thresholds).toEqual([...thresholds].sort((a, b) => a - b));
    expect(new Set(thresholds).size).toBe(thresholds.length);
    expect(thresholds[0]).toBe(0);
  });
});

describe('shuffle', () => {
  it('returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5];
    const copy = [...input];
    const result = shuffle(input);
    expect(input).toEqual(copy);
    expect([...result].sort((a, b) => a - b)).toEqual(copy);
  });
});

describe('pickQuestions', () => {
  it('draws the configured number with the difficulty mix', () => {
    const picked = pickQuestions(QUIZ_BANK, []);
    expect(picked).toHaveLength(QUIZ_QUESTION_COUNT);

    const byDifficulty = { basic: 0, intermediate: 0, advanced: 0 };
    picked.forEach((question) => {
      byDifficulty[question.difficulty] += 1;
    });
    expect(byDifficulty).toEqual(QUIZ_DIFFICULTY_MIX);
  });

  it('never repeats a question within one draw', () => {
    for (let i = 0; i < 10; i += 1) {
      const picked = pickQuestions(QUIZ_BANK, []);
      expect(new Set(picked.map((question) => question.id)).size).toBe(picked.length);
    }
  });

  it('biases toward topics the student got wrong', () => {
    // Every past malus-law answer wrong, everything else right.
    const malus = QUIZ_BANK.filter((question) => question.topic === 'malus-law');
    const others = QUIZ_BANK.filter((question) => question.topic !== 'malus-law');
    const attempt = completedAttempt(
      [...malus, ...others.slice(0, 5)].map((question) => question.id),
      [
        ...malus.map((question) => (question.answerIndex + 1) % 4),
        ...others.slice(0, 5).map((question) => question.answerIndex),
      ],
    );

    const baselineRuns = 200;
    let weightedMalus = 0;
    let plainMalus = 0;
    for (let i = 0; i < baselineRuns; i += 1) {
      weightedMalus += pickQuestions(QUIZ_BANK, [attempt]).filter(
        (question) => question.topic === 'malus-law',
      ).length;
      plainMalus += pickQuestions(QUIZ_BANK, []).filter(
        (question) => question.topic === 'malus-law',
      ).length;
    }
    // Weak-topic weighting should draw malus-law questions more often on average.
    expect(weightedMalus).toBeGreaterThan(plainMalus);
  });
});

describe('topicErrorRates', () => {
  it('computes per-topic error rates from display-order answers', () => {
    const question = QUIZ_BANK[0];
    const wrongDisplayIndex = (question.answerIndex + 1) % 4;
    const attempt = completedAttempt([question.id], [wrongDisplayIndex]);
    const rates = topicErrorRates([attempt], QUIZ_BANK);
    expect(rates.get(question.topic)).toBe(1);
  });

  it('ignores non-completed attempts', () => {
    const question = QUIZ_BANK[0];
    const attempt = {
      ...completedAttempt([question.id], [null]),
      status: 'in_progress' as const,
    };
    expect(topicErrorRates([attempt], QUIZ_BANK).size).toBe(0);
    expect(hasPersonalizationSignal([attempt])).toBe(false);
  });
});
