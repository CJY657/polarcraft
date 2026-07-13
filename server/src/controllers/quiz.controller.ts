/**
 * Quiz Controller
 * 测验控制器
 *
 * Server-side grading: the question bank's answers and explanations are only
 * revealed after an attempt is submitted.
 * 服务端评分：题库答案与解析仅在提交后返回。
 */

import type { Request, Response } from 'express';
import { QUIZ_BANK } from '../data/quiz-bank.js';
import {
  QUIZ_DURATION_SECONDS,
  QUIZ_PASS_PERCENT,
  QUIZ_TIERS,
  hasPersonalizationSignal,
  pickQuestions,
  shuffle,
  tierForPercent,
} from '../config/quiz.config.js';
import { QuizModel } from '../models/quiz.model.js';
import { logger } from '../utils/logger.js';
import type {
  QuizAttemptQuestion,
  QuizAttemptSummary,
  QuizReviewItem,
  StartQuizResult,
  SubmitQuizResult,
} from '../types/quiz.types.js';

const bankById = new Map(QUIZ_BANK.map((question) => [question.id, question]));

export class QuizController {
  /**
   * POST /api/quiz/start — draw a (personalized) question set and open an attempt.
   * 抽取（个性化的）题目集合并开启一次作答。
   */
  static async start(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.sub;

      const pastAttempts = await QuizModel.listCompletedByUser(userId);
      const questions = pickQuestions(QUIZ_BANK, pastAttempts);
      const personalized = hasPersonalizationSignal(pastAttempts);

      // Shuffle option order per question; optionOrder[displayIndex] = canonicalIndex.
      // 每题打乱选项顺序；optionOrder[展示序号] = 题库原始序号。
      const optionOrders = questions.map((question) =>
        shuffle(question.options.map((_, index) => index)),
      );

      const expiresAt = new Date(Date.now() + QUIZ_DURATION_SECONDS * 1000);
      const attempt = await QuizModel.createAttempt({
        user_id: userId,
        question_ids: questions.map((question) => question.id),
        option_orders: optionOrders,
        total: questions.length,
        expires_at: expiresAt,
        personalized,
      });

      const delivered: QuizAttemptQuestion[] = questions.map((question, index) => ({
        questionId: question.id,
        topic: question.topic,
        difficulty: question.difficulty,
        question: question.question,
        options: optionOrders[index].map((canonicalIndex) => question.options[canonicalIndex]),
        optionOrder: optionOrders[index],
      }));

      const result: StartQuizResult = {
        attemptId: attempt.id,
        total: attempt.total,
        durationSeconds: QUIZ_DURATION_SECONDS,
        expiresAt: expiresAt.toISOString(),
        personalized,
        questions: delivered,
      };

      res.success(result, '测验已开始', 201);
    } catch (error) {
      logger.error('Start quiz error:', error);
      res.error('开始测验失败，请稍后再试', 'SERVER_ERROR', 500);
    }
  }

  /**
   * POST /api/quiz/:attemptId/submit — grade and persist an attempt.
   * 评分并保存一次作答。
   */
  static async submit(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.sub;
      const attemptId = req.params.attemptId;
      const answers = req.body.answers as (number | null)[];

      const attempt = await QuizModel.getById(attemptId);
      if (!attempt || attempt.user_id !== userId) {
        res.error('作答记录不存在', 'NOT_FOUND', 404);
        return;
      }
      if (attempt.status !== 'in_progress') {
        res.error('该次作答已结束，无法重复提交', 'ATTEMPT_CLOSED', 409);
        return;
      }
      // Allow a small grace window for network latency on the final submit.
      // 允许少量宽限时间以容忍提交时的网络延迟。
      const graceMs = 15 * 1000;
      if (Date.now() > attempt.expires_at.getTime() + graceMs) {
        await QuizModel.markExpired(attempt.id);
        res.error('作答已超时，请重新开始测验', 'ATTEMPT_EXPIRED', 410);
        return;
      }
      if (!Array.isArray(answers) || answers.length !== attempt.question_ids.length) {
        res.error('答案数量与题目数量不一致', 'VALIDATION_ERROR', 400);
        return;
      }

      let score = 0;
      const review: QuizReviewItem[] = [];

      attempt.question_ids.forEach((questionId, position) => {
        const question = bankById.get(questionId);
        if (!question) {
          return;
        }
        const order = attempt.option_orders[position];
        const displayAnswer = answers[position];
        const canonicalAnswer =
          typeof displayAnswer === 'number' && displayAnswer >= 0 && displayAnswer < order.length
            ? order[displayAnswer]
            : null;
        const isCorrect = canonicalAnswer === question.answerIndex;
        if (isCorrect) {
          score += 1;
        }

        // Report indexes in the display order the student saw.
        // 以学生看到的展示顺序返回序号。
        review.push({
          questionId: question.id,
          topic: question.topic,
          question: question.question,
          options: order.map((canonicalIndex) => question.options[canonicalIndex]),
          yourIndex: typeof displayAnswer === 'number' ? displayAnswer : null,
          correctIndex: order.indexOf(question.answerIndex),
          isCorrect,
          explanation: question.explanation,
        });
      });

      const percent = Math.round((score / attempt.total) * 100);
      const tier = tierForPercent(percent);
      const durationSeconds = Math.min(
        Math.round((Date.now() - attempt.started_at.getTime()) / 1000),
        QUIZ_DURATION_SECONDS,
      );

      await QuizModel.complete(attempt.id, {
        answers,
        score,
        percent,
        tier: tier.id,
        duration_seconds: durationSeconds,
      });

      const result: SubmitQuizResult = {
        attemptId: attempt.id,
        score,
        total: attempt.total,
        percent,
        tier,
        durationSeconds,
        review,
      };

      res.success(result, '测验已完成');
    } catch (error) {
      logger.error('Submit quiz error:', error);
      res.error('提交测验失败，请稍后再试', 'SERVER_ERROR', 500);
    }
  }

  /**
   * GET /api/quiz/me — the current user's attempt history.
   * 当前用户的作答历史。
   */
  static async getMyAttempts(req: Request, res: Response): Promise<void> {
    try {
      const attempts = await QuizModel.listByUser(req.user!.sub);
      const items: QuizAttemptSummary[] = attempts.map((attempt) => ({
        id: attempt.id,
        score: attempt.score,
        total: attempt.total,
        percent: attempt.percent,
        tier: attempt.tier,
        status: attempt.status,
        completed_at: attempt.completed_at ? new Date(attempt.completed_at).toISOString() : null,
        created_at: new Date(attempt.created_at).toISOString(),
      }));

      res.success({ items, tiers: QUIZ_TIERS });
    } catch (error) {
      logger.error('List my quiz attempts error:', error);
      res.error('获取测验记录失败，请稍后再试', 'SERVER_ERROR', 500);
    }
  }

  /**
   * GET /api/quiz/admin/attempts — per-student aggregated table (admin).
   * 每位学生一行的聚合表（管理端）。
   */
  static async adminListAttempts(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(Number.parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
      const pageSize = Math.min(
        Math.max(Number.parseInt(String(req.query.pageSize ?? '20'), 10) || 20, 1),
        100,
      );
      const sortBy =
        req.query.sortBy === 'latest_at' || req.query.sortBy === 'attempts'
          ? req.query.sortBy
          : 'best_percent';
      const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
      const search =
        typeof req.query.search === 'string' && req.query.search.trim()
          ? req.query.search.trim()
          : undefined;

      const result = await QuizModel.adminList({ page, pageSize, sortBy, sortOrder, search });
      res.success({ ...result, tiers: QUIZ_TIERS });
    } catch (error) {
      logger.error('Admin list quiz attempts error:', error);
      res.error('获取测验成绩失败，请稍后再试', 'SERVER_ERROR', 500);
    }
  }

  /**
   * GET /api/quiz/admin/stats — overall statistics (admin).
   * 整体统计（管理端）。
   */
  static async adminStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await QuizModel.adminStats(QUIZ_PASS_PERCENT);
      res.success({ ...stats, pass_percent: QUIZ_PASS_PERCENT, tiers: QUIZ_TIERS });
    } catch (error) {
      logger.error('Admin quiz stats error:', error);
      res.error('获取测验统计失败，请稍后再试', 'SERVER_ERROR', 500);
    }
  }
}
