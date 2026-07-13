/**
 * Quiz Model
 * 测验数据模型
 *
 * Persists quiz attempts (collection: quiz_attempts) and provides admin
 * aggregations. Mirrors the static-class model pattern in feedback.model.ts.
 * 持久化作答记录（集合：quiz_attempts）并提供管理端聚合，沿用 feedback.model.ts 的静态类模式。
 */

import { getCollection } from '../database/connection.js';
import { generateId } from '../utils/crypto.util.js';
import { normalizeDocument } from '../database/mongo.util.js';
import type {
  AdminQuizLearnerRow,
  AdminQuizListResult,
  AdminQuizStats,
  QuizAttempt,
} from '../types/quiz.types.js';

const attemptsCollection = () => getCollection('quiz_attempts');

/**
 * Storage packing for the per-question arrays, which dominate attempt size.
 * `option_orders` [[1,3,2,0],…] → "1320,0132,…"（one digit group per question）
 * `answers` [0,3,null,…] → "0,3,,…"（empty slot = unanswered）
 * Roughly halves each stored document. Reads accept both the packed string
 * and the legacy array form, so existing documents need no migration and the
 * decoded shape returned to callers is unchanged.
 * 存储层压缩每题数组（作答文档的主要体积来源）：选项顺序打包为数字串、答案打包
 * 为逗号分隔串，文档体积约减半。读取同时兼容旧的数组格式，线上数据无需迁移，
 * 返回给调用方的结构保持不变。
 */
function encodeOptionOrders(orders: number[][]): string | number[][] {
  const packable = orders.every(
    (order) =>
      Array.isArray(order) &&
      order.every((index) => Number.isInteger(index) && index >= 0 && index <= 9)
  );
  if (!packable) {
    return orders;
  }

  return orders.map((order) => order.join('')).join(',');
}

function decodeOptionOrders(value: unknown): number[][] {
  if (typeof value === 'string') {
    return value === '' ? [] : value.split(',').map((group) => Array.from(group, Number));
  }

  return Array.isArray(value) ? (value as number[][]) : [];
}

function encodeAnswers(answers: (number | null)[]): string | (number | null)[] {
  const packable = answers.every(
    (answer) => answer === null || (Number.isInteger(answer) && (answer as number) >= 0)
  );
  if (!packable) {
    return answers;
  }

  const packed = answers.map((answer) => (answer === null ? '' : String(answer))).join(',');
  // "" would be indistinguishable from an empty list — keep [null] as an array.
  return packed === '' && answers.length > 0 ? answers : packed;
}

function decodeAnswers(value: unknown): (number | null)[] {
  if (typeof value === 'string') {
    return value === '' ? [] : value.split(',').map((slot) => (slot === '' ? null : Number(slot)));
  }

  return Array.isArray(value) ? (value as (number | null)[]) : [];
}

function decodeAttempt(attempt: QuizAttempt | null): QuizAttempt | null {
  if (!attempt) {
    return null;
  }

  return {
    ...attempt,
    option_orders: decodeOptionOrders(attempt.option_orders),
    answers: decodeAnswers(attempt.answers),
  };
}

export interface CreateAttemptInput {
  user_id: string;
  question_ids: string[];
  option_orders: number[][];
  total: number;
  expires_at: Date;
  personalized: boolean;
}

export interface CompleteAttemptInput {
  answers: (number | null)[];
  score: number;
  percent: number;
  tier: string;
  duration_seconds: number;
}

export interface AdminListOptions {
  page: number;
  pageSize: number;
  sortBy: 'best_percent' | 'latest_at' | 'attempts';
  sortOrder: 'asc' | 'desc';
  search?: string;
}

export class QuizModel {
  static async createAttempt(input: CreateAttemptInput): Promise<QuizAttempt> {
    const now = new Date();
    const attempt: QuizAttempt = {
      id: generateId(),
      user_id: input.user_id,
      question_ids: input.question_ids,
      option_orders: input.option_orders,
      answers: [],
      score: 0,
      total: input.total,
      percent: 0,
      tier: null,
      status: 'in_progress',
      started_at: now,
      completed_at: null,
      duration_seconds: null,
      expires_at: input.expires_at,
      personalized: input.personalized,
      created_at: now,
    };

    await attemptsCollection().insertOne({
      ...attempt,
      option_orders: encodeOptionOrders(attempt.option_orders),
      answers: encodeAnswers(attempt.answers),
    } as unknown as Record<string, unknown>);
    return attempt;
  }

  static async getById(id: string): Promise<QuizAttempt | null> {
    return decodeAttempt(normalizeDocument<QuizAttempt>(await attemptsCollection().findOne({ id })));
  }

  /**
   * Past completed attempts for a user, used for weak-topic personalization.
   * 用户过往已完成的作答，用于薄弱知识点个性化。
   */
  static async listCompletedByUser(userId: string): Promise<QuizAttempt[]> {
    const documents = await attemptsCollection()
      .find({ user_id: userId, status: 'completed' })
      .sort({ created_at: -1 })
      .limit(50)
      .toArray();

    return documents
      .map((document) => decodeAttempt(normalizeDocument<QuizAttempt>(document)))
      .filter((document): document is QuizAttempt => document !== null);
  }

  /**
   * A user's attempt history (most recent first).
   * 用户的作答历史（最新在前）。
   */
  static async listByUser(userId: string, limit = 20): Promise<QuizAttempt[]> {
    const documents = await attemptsCollection()
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    return documents
      .map((document) => decodeAttempt(normalizeDocument<QuizAttempt>(document)))
      .filter((document): document is QuizAttempt => document !== null);
  }

  static async complete(id: string, input: CompleteAttemptInput): Promise<void> {
    await attemptsCollection().updateOne(
      { id },
      {
        $set: {
          answers: encodeAnswers(input.answers),
          score: input.score,
          percent: input.percent,
          tier: input.tier,
          status: 'completed',
          completed_at: new Date(),
          duration_seconds: input.duration_seconds,
        },
      },
    );
  }

  static async markExpired(id: string): Promise<void> {
    await attemptsCollection().updateOne(
      { id, status: 'in_progress' },
      { $set: { status: 'expired' } },
    );
  }

  /**
   * Admin: one aggregated row per student across completed attempts.
   * 管理端：跨已完成作答，每位学生一行聚合数据。
   */
  static async adminList(options: AdminListOptions): Promise<AdminQuizListResult> {
    const sortField =
      options.sortBy === 'attempts'
        ? 'attempts'
        : options.sortBy === 'latest_at'
          ? 'latest_at'
          : 'best_percent';
    const sortDirection = options.sortOrder === 'asc' ? 1 : -1;

    const searchMatch = options.search
      ? {
          $or: [
            { username: { $regex: options.search, $options: 'i' } },
            { nickname: { $regex: options.search, $options: 'i' } },
          ],
        }
      : null;

    const basePipeline: Record<string, unknown>[] = [
      { $match: { status: 'completed' } },
      { $sort: { created_at: 1 } },
      {
        $group: {
          _id: '$user_id',
          attempts: { $sum: 1 },
          best_percent: { $max: '$percent' },
          latest_percent: { $last: '$percent' },
          latest_tier: { $last: '$tier' },
          latest_at: { $last: '$completed_at' },
          // Best tier is the tier of the highest-percent attempt.
          best_docs: { $push: { percent: '$percent', tier: '$tier' } },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          user_id: '$_id',
          username: '$user.username',
          nickname: '$user.nickname',
          attempts: 1,
          best_percent: 1,
          latest_percent: 1,
          latest_tier: 1,
          latest_at: 1,
          best_tier: {
            $let: {
              vars: {
                top: {
                  $first: {
                    $filter: {
                      input: '$best_docs',
                      as: 'd',
                      cond: { $eq: ['$$d.percent', '$best_percent'] },
                    },
                  },
                },
              },
              in: '$$top.tier',
            },
          },
        },
      },
      ...(searchMatch ? [{ $match: searchMatch }] : []),
    ];

    const countResult = await attemptsCollection()
      .aggregate([...basePipeline, { $count: 'total' }])
      .toArray();
    const total = countResult[0]?.total ?? 0;

    const items = (await attemptsCollection()
      .aggregate([
        ...basePipeline,
        { $sort: { [sortField]: sortDirection, user_id: 1 } },
        { $skip: (options.page - 1) * options.pageSize },
        { $limit: options.pageSize },
      ])
      .toArray()) as unknown as AdminQuizLearnerRow[];

    return { items, total };
  }

  /**
   * Admin: overall statistics across completed attempts.
   * 管理端：已完成作答的整体统计。
   */
  static async adminStats(passPercent: number): Promise<AdminQuizStats> {
    const result = await attemptsCollection()
      .aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            total_attempts: { $sum: 1 },
            participants: { $addToSet: '$user_id' },
            average_percent: { $avg: '$percent' },
            passed: {
              $sum: { $cond: [{ $gte: ['$percent', passPercent] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            total_attempts: 1,
            participants: { $size: '$participants' },
            average_percent: 1,
            pass_rate: {
              $cond: [
                { $gt: ['$total_attempts', 0] },
                { $divide: ['$passed', '$total_attempts'] },
                0,
              ],
            },
          },
        },
      ])
      .toArray();

    const tierResult = (await attemptsCollection()
      .aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$tier', count: { $sum: 1 } } },
        { $project: { _id: 0, tier: '$_id', count: 1 } },
      ])
      .toArray()) as unknown as Array<{ tier: string; count: number }>;

    const summary = result[0] ?? {
      total_attempts: 0,
      participants: 0,
      average_percent: 0,
      pass_rate: 0,
    };

    return {
      total_attempts: summary.total_attempts ?? 0,
      participants: summary.participants ?? 0,
      average_percent: Math.round((summary.average_percent ?? 0) * 10) / 10,
      pass_rate: Math.round((summary.pass_rate ?? 0) * 1000) / 1000,
      tier_distribution: tierResult,
    };
  }
}
