/**
 * QuizPage — 偏振知识测验
 *
 * Orchestrates intro → runner → result. Requires login (mounted inside
 * ProtectedRoute); grading happens server-side.
 * 组织 首屏 → 答题 → 成绩 三个阶段。需登录（挂载于 ProtectedRoute 内），评分在服务端完成。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { PersistentHeader } from '@/components/shared';
import { capturePostHogEvent } from '@/lib/posthog';
import {
  quizApi,
  type MyQuizAttemptsResult,
  type StartQuizResult,
  type SubmitQuizResult,
} from '@/lib/quiz.service';
import { QuizIntro } from '@/feature/quiz/QuizIntro';
import { QuizRunner } from '@/feature/quiz/QuizRunner';
import { QuizResult } from '@/feature/quiz/QuizResult';

type Phase = 'intro' | 'running' | 'result';

export default function QuizPage() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [history, setHistory] = useState<MyQuizAttemptsResult | null>(null);
  const [quiz, setQuiz] = useState<StartQuizResult | null>(null);
  const [result, setResult] = useState<SubmitQuizResult | null>(null);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    quizApi
      .getMyAttempts()
      .then((data) => {
        if (!cancelled) setHistory(data);
      })
      .catch(() => {
        // History is decorative on the intro screen — ignore load errors.
        // 首屏历史仅作展示，加载失败可忽略。
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const start = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      const data = await quizApi.start();
      submittedRef.current = false;
      setQuiz(data);
      setResult(null);
      setPhase('running');
      capturePostHogEvent('quiz_started', {
        attempt_id: data.attemptId,
        personalized: data.personalized,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '开始测验失败，请稍后再试');
    } finally {
      setStarting(false);
    }
  }, []);

  const submit = useCallback(
    async (answers: (number | null)[]) => {
      if (!quiz || submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      setError(null);
      try {
        const data = await quizApi.submit(quiz.attemptId, answers);
        setResult(data);
        setPhase('result');
        capturePostHogEvent('quiz_completed', {
          attempt_id: data.attemptId,
          score: data.score,
          percent: data.percent,
          tier: data.tier.id,
        });
        // Refresh history so a follow-up intro screen shows the new best.
        // 刷新历史，返回首屏时显示最新最好成绩。
        quizApi
          .getMyAttempts()
          .then(setHistory)
          .catch(() => {});
      } catch (err) {
        submittedRef.current = false;
        setError(err instanceof Error ? err.message : '提交测验失败，请稍后再试');
      } finally {
        setSubmitting(false);
      }
    },
    [quiz],
  );

  return (
    <div className="min-h-screen bg-[#fffaf0] text-[#0a0a0a]">
      <PersistentHeader variant="solid" showBreadcrumb={false} />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        {phase === 'intro' && (
          <QuizIntro history={history} starting={starting} error={error} onStart={start} />
        )}
        {phase === 'running' && quiz && (
          <QuizRunner quiz={quiz} submitting={submitting} error={error} onSubmit={submit} />
        )}
        {phase === 'result' && result && (
          <QuizResult
            result={result}
            personalized={quiz?.personalized ?? false}
            restarting={starting}
            onRestart={start}
          />
        )}
      </main>
    </div>
  );
}
