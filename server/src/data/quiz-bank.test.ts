import { describe, expect, it } from 'vitest';
import { QUIZ_BANK } from './quiz-bank.js';
import { QUIZ_DIFFICULTY_MIX } from '../config/quiz.config.js';

describe('QUIZ_BANK integrity', () => {
  it('has unique question ids', () => {
    const ids = QUIZ_BANK.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every question has exactly 4 options and a valid answerIndex', () => {
    for (const question of QUIZ_BANK) {
      expect(question.options, question.id).toHaveLength(4);
      expect(question.answerIndex, question.id).toBeGreaterThanOrEqual(0);
      expect(question.answerIndex, question.id).toBeLessThan(4);
    }
  });

  it('every question has non-empty bilingual text and explanation', () => {
    for (const question of QUIZ_BANK) {
      expect(question.question.zh.trim(), question.id).not.toBe('');
      expect(question.question.en.trim(), question.id).not.toBe('');
      expect(question.explanation.zh.trim(), question.id).not.toBe('');
      for (const option of question.options) {
        expect(option.zh.trim(), question.id).not.toBe('');
      }
    }
  });

  it('has enough questions per difficulty for the configured draw', () => {
    for (const [difficulty, needed] of Object.entries(QUIZ_DIFFICULTY_MIX)) {
      const available = QUIZ_BANK.filter(
        (question) => question.difficulty === difficulty,
      ).length;
      expect(available, difficulty).toBeGreaterThanOrEqual(needed);
    }
  });
});
