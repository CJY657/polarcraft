/**
 * QuizIntro — start screen: rules, tier ladder, personal history.
 * 测验首屏：规则说明、评级阶梯、个人历史。
 */

import { PlayCircle, Timer, ListChecks, Sparkles, History } from 'lucide-react';
import type { MyQuizAttemptsResult } from '@/lib/quiz.service';
import { tierLabelZh, tierStyle } from './quizTiers';

interface QuizIntroProps {
  history: MyQuizAttemptsResult | null;
  starting: boolean;
  error: string | null;
  onStart: () => void;
}

const RULES = [
  { icon: ListChecks, text: '共 20 道单选题，覆盖偏振基础、马吕斯定律、布儒斯特角、双折射、波片、旋光与散射等内容' },
  { icon: Timer, text: '限时 25 分钟，超时未提交视为无效' },
  { icon: Sparkles, text: '再次挑战时，系统会侧重你之前答错的知识点' },
];

export function QuizIntro({ history, starting, error, onStart }: QuizIntroProps) {
  const completed = history?.items.filter((item) => item.status === 'completed') ?? [];
  const best = completed.reduce<number | null>(
    (max, item) => (max === null || item.percent > max ? item.percent : max),
    null,
  );
  const tiers = history?.tiers ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-stone-900">偏振知识测验</h1>
        <p className="mt-2 text-stone-600">
          检验你对偏振光学的掌握程度——从横波本质到琼斯矢量，完成后将获得你的偏振等级称号。
        </p>

        <ul className="mt-6 space-y-3">
          {RULES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-stone-700">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
              <span>{text}</span>
            </li>
          ))}
        </ul>

        {tiers.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-stone-500">等级阶梯</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...tiers]
                .sort((a, b) => a.minPercent - b.minPercent)
                .map((tier) => (
                  <span
                    key={tier.id}
                    className={`rounded-full px-3 py-1 text-sm font-medium ${tierStyle(tier.id).badge}`}
                  >
                    {tier.label.zh} · {tier.minPercent}分+
                  </span>
                ))}
            </div>
          </div>
        )}

        {completed.length > 0 && (
          <div className="mt-6 flex items-center gap-2 rounded-lg bg-stone-50 px-4 py-3 text-sm text-stone-600">
            <History className="h-4 w-4 shrink-0 text-stone-400" aria-hidden />
            <span>
              你已完成 {completed.length} 次测验，最好成绩 {best} 分（
              {tierLabelZh(
                completed.find((item) => item.percent === best)?.tier ?? null,
                tiers,
              )}
              ）
            </span>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onStart}
          disabled={starting}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-3 font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlayCircle className="h-5 w-5" aria-hidden />
          {starting ? '正在抽题…' : completed.length > 0 ? '再次挑战' : '开始测验'}
        </button>
      </div>
    </div>
  );
}
