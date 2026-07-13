/**
 * QuizRunner — question stepper with countdown and answer grid.
 * 答题器：题目步进、倒计时与答题卡。
 */

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Send, Timer } from 'lucide-react';
import type { StartQuizResult } from '@/lib/quiz.service';

interface QuizRunnerProps {
  quiz: StartQuizResult;
  submitting: boolean;
  error: string | null;
  onSubmit: (answers: (number | null)[]) => void;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  basic: '基础',
  intermediate: '进阶',
  advanced: '挑战',
};

function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function QuizRunner({ quiz, submitting, error, onSubmit }: QuizRunnerProps) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    quiz.questions.map(() => null),
  );
  const expiresAtMs = useMemo(() => new Date(quiz.expiresAt).getTime(), [quiz.expiresAt]);
  const [remaining, setRemaining] = useState(() =>
    Math.max(Math.round((expiresAtMs - Date.now()) / 1000), 0),
  );

  // Countdown; auto-submit whatever is answered when time runs out.
  // 倒计时；时间耗尽时自动提交已作答部分。
  useEffect(() => {
    const timer = window.setInterval(() => {
      const left = Math.max(Math.round((expiresAtMs - Date.now()) / 1000), 0);
      setRemaining(left);
      if (left <= 0) {
        window.clearInterval(timer);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAtMs]);

  useEffect(() => {
    if (remaining === 0 && !submitting) {
      onSubmit(answers);
    }
    // Intentionally only fire on the countdown reaching zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const question = quiz.questions[current];
  const answeredCount = answers.filter((answer) => answer !== null).length;
  const lowTime = remaining <= 60;

  const choose = (optionIndex: number) => {
    setAnswers((previous) => {
      const next = [...previous];
      next[current] = optionIndex;
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Status bar / 状态栏 */}
      <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-5 py-3 shadow-sm">
        <span className="text-sm text-stone-600">
          第 <span className="font-semibold text-stone-900">{current + 1}</span> / {quiz.total} 题
          <span className="ml-3 text-stone-400">已答 {answeredCount}</span>
        </span>
        <span
          className={`inline-flex items-center gap-1.5 font-mono text-sm font-semibold ${
            lowTime ? 'text-red-600' : 'text-stone-700'
          }`}
          aria-live={lowTime ? 'assertive' : 'off'}
        >
          <Timer className="h-4 w-4" aria-hidden />
          {formatSeconds(remaining)}
        </span>
      </div>

      {/* Question card / 题目卡片 */}
      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span className="rounded-full bg-stone-100 px-2 py-0.5">
            {DIFFICULTY_LABELS[question.difficulty] ?? question.difficulty}
          </span>
        </div>
        <p className="mt-3 text-lg font-medium leading-relaxed text-stone-900">
          {question.question.zh}
        </p>

        <div className="mt-6 space-y-3" role="radiogroup" aria-label={`第 ${current + 1} 题选项`}>
          {question.options.map((option, index) => {
            const selected = answers[current] === index;
            return (
              <button
                key={index}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose(index)}
                className={`block w-full rounded-xl border px-4 py-3 text-left transition ${
                  selected
                    ? 'border-amber-500 bg-amber-50 text-stone-900 ring-1 ring-amber-500'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                }`}
              >
                <span className="mr-2 font-semibold text-stone-400">
                  {String.fromCharCode(65 + index)}.
                </span>
                {option.zh}
              </button>
            );
          })}
        </div>
      </div>

      {/* Answer sheet / 答题卡 */}
      <div className="mt-4 flex flex-wrap gap-2" aria-label="答题卡">
        {quiz.questions.map((_, index) => {
          const isCurrent = index === current;
          const isAnswered = answers[index] !== null;
          return (
            <button
              key={index}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={`跳到第 ${index + 1} 题${isAnswered ? '（已答）' : ''}`}
              className={`h-9 w-9 rounded-lg text-sm font-medium transition ${
                isCurrent
                  ? 'bg-stone-900 text-white'
                  : isAnswered
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-white text-stone-500 ring-1 ring-stone-200 hover:bg-stone-50'
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {/* Navigation / 导航 */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrent((value) => Math.max(value - 1, 0))}
          disabled={current === 0}
          className="inline-flex items-center gap-1 rounded-xl border border-stone-300 px-4 py-2.5 font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          上一题
        </button>

        {current < quiz.total - 1 ? (
          <button
            type="button"
            onClick={() => setCurrent((value) => Math.min(value + 1, quiz.total - 1))}
            className="inline-flex items-center gap-1 rounded-xl bg-stone-900 px-4 py-2.5 font-medium text-white transition hover:bg-stone-700"
          >
            下一题
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSubmit(answers)}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" aria-hidden />
            {submitting ? '正在提交…' : `交卷（已答 ${answeredCount}/${quiz.total}）`}
          </button>
        )}
      </div>
    </div>
  );
}
