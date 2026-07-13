/**
 * QuizResult — animated tier reveal, score, wrong-answer review.
 * 成绩页：等级揭晓动画、得分与错题回顾。
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import type { SubmitQuizResult } from '@/lib/quiz.service';
import { tierStyle } from './quizTiers';

interface QuizResultProps {
  result: SubmitQuizResult;
  personalized: boolean;
  restarting: boolean;
  onRestart: () => void;
}

export function QuizResult({ result, personalized, restarting, onRestart }: QuizResultProps) {
  const [showAllReview, setShowAllReview] = useState(false);
  const style = tierStyle(result.tier.id);
  const wrong = result.review.filter((item) => !item.isCorrect);
  const reviewItems = showAllReview ? result.review : wrong;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Tier reveal / 等级揭晓 */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 14 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${style.accent}1a` }}
        >
          <Award className="h-8 w-8" style={{ color: style.accent }} aria-hidden />
        </motion.div>

        <p className="mt-4 text-sm text-stone-500">你的偏振等级</p>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`mt-1 text-3xl font-bold ${style.text}`}
        >
          {result.tier.label.zh}
        </motion.h1>

        <p className="mt-4 text-5xl font-bold tabular-nums text-stone-900">
          {result.percent}
          <span className="ml-1 text-lg font-medium text-stone-400">分</span>
        </p>
        <p className="mt-2 text-stone-500">
          答对 {result.score} / {result.total} 题
          {typeof result.durationSeconds === 'number' &&
            ` · 用时 ${Math.floor(result.durationSeconds / 60)} 分 ${result.durationSeconds % 60} 秒`}
        </p>

        {personalized && (
          <p className="mt-3 text-sm text-amber-700">本次已侧重你之前的薄弱知识点</p>
        )}

        <button
          type="button"
          onClick={onRestart}
          disabled={restarting}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-stone-300 px-5 py-2.5 font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          {restarting ? '正在抽题…' : '再来一次'}
        </button>
      </motion.div>

      {/* Review / 题目回顾 */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">
            {wrong.length > 0 ? `错题回顾（${wrong.length} 题）` : '全部答对，太棒了！'}
          </h2>
          <button
            type="button"
            onClick={() => setShowAllReview((value) => !value)}
            className="text-sm font-medium text-stone-500 underline-offset-4 hover:text-stone-700 hover:underline"
          >
            {showAllReview ? '只看错题' : '查看全部题目'}
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {reviewItems.map((item) => (
            <div
              key={item.questionId}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-2">
                {item.isCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" aria-hidden />
                )}
                <p className="font-medium leading-relaxed text-stone-900">{item.question.zh}</p>
              </div>

              <ul className="mt-3 space-y-1.5 pl-7">
                {item.options.map((option, index) => {
                  const isCorrectOption = index === item.correctIndex;
                  const isYourWrongPick = index === item.yourIndex && !item.isCorrect;
                  return (
                    <li
                      key={index}
                      className={`rounded-lg px-3 py-1.5 text-sm ${
                        isCorrectOption
                          ? 'bg-emerald-50 font-medium text-emerald-800'
                          : isYourWrongPick
                            ? 'bg-red-50 text-red-700 line-through'
                            : 'text-stone-600'
                      }`}
                    >
                      <span className="mr-1.5 font-semibold">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {option.zh}
                      {isCorrectOption && <span className="ml-2 text-xs">✓ 正确答案</span>}
                      {isYourWrongPick && <span className="ml-2 text-xs no-underline">你的选择</span>}
                      {item.yourIndex === null && isCorrectOption && (
                        <span className="ml-2 text-xs text-stone-400">（本题未作答）</span>
                      )}
                    </li>
                  );
                })}
              </ul>

              <p className="mt-3 rounded-lg bg-stone-50 px-4 py-3 pl-4 text-sm leading-relaxed text-stone-600">
                <span className="font-semibold text-stone-700">解析：</span>
                {item.explanation.zh}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
