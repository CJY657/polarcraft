import { beforeEach, describe, expect, it, vi } from 'vitest';

const attemptsFindOne = vi.fn();
const attemptsFind = vi.fn();
const attemptsInsertOne = vi.fn();
const attemptsUpdateOne = vi.fn();

vi.mock('../database/connection.js', () => ({
  getCollection: (name: string) => {
    if (name === 'quiz_attempts') {
      return {
        findOne: (...args: unknown[]) => attemptsFindOne(...args),
        find: (...args: unknown[]) => attemptsFind(...args),
        insertOne: (...args: unknown[]) => attemptsInsertOne(...args),
        updateOne: (...args: unknown[]) => attemptsUpdateOne(...args),
      };
    }

    return {};
  },
}));

vi.mock('../utils/crypto.util.js', () => ({
  generateId: vi.fn(() => 'generated-attempt-id'),
}));

import { QuizModel } from './quiz.model.js';

function createCursor(documents: Array<Record<string, unknown>>) {
  const cursor = {
    sort: vi.fn(),
    limit: vi.fn(),
    toArray: vi.fn(async () => documents),
  };

  cursor.sort.mockReturnValue(cursor);
  cursor.limit.mockReturnValue(cursor);

  return cursor;
}

const ORDERS = [
  [1, 3, 2, 0],
  [0, 1, 3, 2],
  [2, 0, 1, 3],
];

describe('QuizModel storage packing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createAttempt stores packed strings but returns arrays', async () => {
    attemptsInsertOne.mockResolvedValue({ insertedId: 'x' });

    const attempt = await QuizModel.createAttempt({
      user_id: 'user-1',
      question_ids: ['q-1', 'q-2', 'q-3'],
      option_orders: ORDERS,
      total: 3,
      expires_at: new Date('2026-07-13T00:25:00Z'),
      personalized: false,
    });

    expect(attempt.option_orders).toEqual(ORDERS);
    expect(attempt.answers).toEqual([]);

    const stored = attemptsInsertOne.mock.calls[0][0] as Record<string, unknown>;
    expect(stored.option_orders).toBe('1320,0132,2013');
    expect(stored.answers).toBe('');
  });

  it('getById decodes packed documents back to arrays', async () => {
    attemptsFindOne.mockResolvedValue({
      _id: 'raw',
      id: 'attempt-1',
      option_orders: '1320,0132,2013',
      answers: '0,3,,1',
    });

    const attempt = await QuizModel.getById('attempt-1');

    expect(attempt?.option_orders).toEqual(ORDERS);
    expect(attempt?.answers).toEqual([0, 3, null, 1]);
  });

  it('getById passes legacy array documents through unchanged', async () => {
    attemptsFindOne.mockResolvedValue({
      _id: 'raw',
      id: 'attempt-legacy',
      option_orders: ORDERS,
      answers: [0, null, 2],
    });

    const attempt = await QuizModel.getById('attempt-legacy');

    expect(attempt?.option_orders).toEqual(ORDERS);
    expect(attempt?.answers).toEqual([0, null, 2]);
  });

  it('getById decodes an in-progress packed attempt to empty answers', async () => {
    attemptsFindOne.mockResolvedValue({
      _id: 'raw',
      id: 'attempt-open',
      option_orders: '1320',
      answers: '',
    });

    const attempt = await QuizModel.getById('attempt-open');

    expect(attempt?.option_orders).toEqual([[1, 3, 2, 0]]);
    expect(attempt?.answers).toEqual([]);
  });

  it('complete stores packed answers including unanswered slots', async () => {
    attemptsUpdateOne.mockResolvedValue({ matchedCount: 1 });

    await QuizModel.complete('attempt-1', {
      answers: [0, null, 2],
      score: 2,
      percent: 67,
      tier: 'novice',
      duration_seconds: 45,
    });

    const update = attemptsUpdateOne.mock.calls[0][1] as { $set: Record<string, unknown> };
    expect(update.$set.answers).toBe('0,,2');
  });

  it('complete falls back to raw arrays for unpackable answers', async () => {
    attemptsUpdateOne.mockResolvedValue({ matchedCount: 1 });

    const junkAnswers = [0, 1.5, null] as (number | null)[];
    await QuizModel.complete('attempt-1', {
      answers: junkAnswers,
      score: 1,
      percent: 33,
      tier: 'novice',
      duration_seconds: 45,
    });

    const update = attemptsUpdateOne.mock.calls[0][1] as { $set: Record<string, unknown> };
    expect(update.$set.answers).toEqual(junkAnswers);
  });

  it('listByUser decodes mixed packed and legacy documents', async () => {
    attemptsFind.mockReturnValue(
      createCursor([
        { _id: 'a', id: 'new', option_orders: '1320', answers: '3' },
        { _id: 'b', id: 'old', option_orders: [[0, 1, 2, 3]], answers: [null] },
      ])
    );

    const attempts = await QuizModel.listByUser('user-1');

    expect(attempts[0].option_orders).toEqual([[1, 3, 2, 0]]);
    expect(attempts[0].answers).toEqual([3]);
    expect(attempts[1].option_orders).toEqual([[0, 1, 2, 3]]);
    expect(attempts[1].answers).toEqual([null]);
  });

  it('round-trips an all-null answer list without colliding with empty', async () => {
    attemptsUpdateOne.mockResolvedValue({ matchedCount: 1 });

    await QuizModel.complete('attempt-1', {
      answers: [null],
      score: 0,
      percent: 0,
      tier: 'novice',
      duration_seconds: 5,
    });

    // "" would decode to [] and lose the slot — a lone unanswered question
    // must stay in array form.
    const update = attemptsUpdateOne.mock.calls[0][1] as { $set: Record<string, unknown> };
    expect(update.$set.answers).toEqual([null]);

    attemptsUpdateOne.mockClear();
    await QuizModel.complete('attempt-2', {
      answers: [null, null],
      score: 0,
      percent: 0,
      tier: 'novice',
      duration_seconds: 5,
    });

    const packedUpdate = attemptsUpdateOne.mock.calls[0][1] as { $set: Record<string, unknown> };
    expect(packedUpdate.$set.answers).toBe(',');

    attemptsFindOne.mockResolvedValue({ _id: 'raw', id: 'attempt-2', option_orders: '', answers: ',' });
    const attempt = await QuizModel.getById('attempt-2');
    expect(attempt?.answers).toEqual([null, null]);
  });
});
