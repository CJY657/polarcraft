import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  RefreshCw,
} from 'lucide-react'

import { PersistentHeader } from '@/components/shared/PersistentHeader'
import { useTheme } from '@/contexts/ThemeContext'
import {
  adminUserApi,
  type AdminUserActivityResponse,
} from '@/lib/admin-user.service'
import { formatShortDateTime } from '@/lib/datetime.util'
import {
  UserActivityDetail,
  UserTypeBadge,
} from '@/pages/admin/AdminLearnerActivityDrawer'
import { cn } from '@/utils/classNames'

const RANGE_PRESETS = [7, 30, 90, 180, 365] as const
const MAX_RANGE_DAYS = 366

type ActivityRange = { start: string; end: string }

function toDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function presetRange(days: number): ActivityRange {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))
  return { start: toDateInput(start), end: toDateInput(end) }
}

function rangeError(range: ActivityRange, today: string): string | null {
  if (!range.start || !range.end) return '请选择完整的起止日期'
  if (range.start > range.end) return '开始日期不能晚于结束日期'
  if (range.start > today || range.end > today) return '日期不能晚于今天'

  const start = Date.parse(`${range.start}T00:00:00Z`)
  const end = Date.parse(`${range.end}T00:00:00Z`)
  if (Number.isNaN(start) || Number.isNaN(end)) return '起止日期无效'
  if ((end - start) / 86_400_000 + 1 > MAX_RANGE_DAYS) {
    return `时间跨度不能超过 ${MAX_RANGE_DAYS} 天`
  }

  return null
}

export default function AdminUserActivityPage() {
  const { userId = '' } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [range, setRange] = useState<ActivityRange>(() => presetRange(30))
  const [draftRange, setDraftRange] = useState<ActivityRange>(range)
  const [detail, setDetail] = useState<AdminUserActivityResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [retryKey, setRetryKey] = useState(0)
  const isDark = theme === 'dark'
  const today = toDateInput(new Date())
  const validationError = useMemo(
    () => rangeError(draftRange, today),
    [draftRange, today]
  )
  const draftUnchanged =
    draftRange.start === range.start && draftRange.end === range.end

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    setDetail(null)

    void adminUserApi
      .getActivityDetail(userId, range)
      .then((data) => {
        if (!cancelled) setDetail(data)
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : '用户活动详情暂时无法加载'
          )
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId, range.start, range.end, retryKey])

  const selectPreset = (days: number) => {
    const nextRange = presetRange(days)
    setDraftRange(nextRange)
    setRange(nextRange)
  }

  const applyCustomRange = () => {
    if (validationError || draftUnchanged) return
    setRange({ ...draftRange })
  }

  const strong = isDark ? 'text-slate-50' : 'text-[#0a0a0a]'
  const muted = isDark ? 'text-slate-400' : 'text-[#6a6a6a]'
  const surface = isDark
    ? 'border-slate-800 bg-slate-900'
    : 'border-[#e5e5e5] bg-white'

  return (
    <div className={cn('min-h-screen', isDark ? 'bg-slate-950' : 'bg-[#fffaf0]')}>
      <PersistentHeader
        moduleName="用户活动详情"
        variant="glass"
        className={cn(
          'sticky top-0 z-40',
          isDark
            ? 'border-b border-slate-800 bg-slate-950/80'
            : 'border-b border-[#e5e5e5] bg-[#fffaf0]/90'
        )}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          aria-label="返回上一页"
          onClick={() => navigate(-1)}
          className={cn(
            'inline-flex h-10 items-center gap-2 text-sm font-semibold transition-colors',
            isDark
              ? 'text-slate-300 hover:text-white'
              : 'text-[#3a3a3a] hover:text-[#0a0a0a]'
          )}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          返回
        </button>

        <header className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className={cn('break-words text-3xl font-semibold sm:text-4xl', strong)}>
                {detail?.display_name || '用户活动详情'}
              </h1>
              {detail ? (
                <UserTypeBadge userType={detail.user_type} isDark={isDark} />
              ) : null}
            </div>
            <p className={cn('mt-3 text-sm leading-6', muted)}>
              {detail?.username
                ? `账号 ${detail.username} · `
                : ''}
              {range.start} 至 {range.end}
              {detail?.last_activity
                ? ` · 最近活动 ${formatShortDateTime(detail.last_activity)}`
                : ''}
            </p>
          </div>

          <div className="flex max-w-3xl flex-col gap-3">
            <div
              className={cn(
                'grid grid-cols-3 gap-1 rounded-2xl border p-1 sm:grid-cols-5',
                surface
              )}
              aria-label="统计时间范围"
            >
              {RANGE_PRESETS.map((days) => {
                const dates = presetRange(days)
                const selected =
                  range.start === dates.start && range.end === dates.end
                return (
                  <button
                    key={days}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectPreset(days)}
                    className={cn(
                      'h-10 whitespace-nowrap rounded-xl px-3 text-sm font-semibold transition-colors active:scale-[0.98]',
                      selected
                        ? isDark
                          ? 'bg-emerald-300 text-slate-950'
                          : 'bg-[#0a0a0a] text-white'
                        : isDark
                          ? 'text-slate-300 hover:bg-slate-800'
                          : 'text-[#6a6a6a] hover:bg-[#faf5e8]'
                    )}
                  >
                    {days} 天
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <input
                type="date"
                aria-label="开始日期"
                value={draftRange.start}
                max={today}
                onChange={(event) =>
                  setDraftRange((current) => ({
                    ...current,
                    start: event.target.value,
                  }))
                }
                className={cn('h-10 rounded-xl border px-3', surface, strong)}
              />
              <span className={muted}>至</span>
              <input
                type="date"
                aria-label="结束日期"
                value={draftRange.end}
                max={today}
                onChange={(event) =>
                  setDraftRange((current) => ({
                    ...current,
                    end: event.target.value,
                  }))
                }
                className={cn('h-10 rounded-xl border px-3', surface, strong)}
              />
              <button
                type="button"
                aria-label="查询自定义日期"
                disabled={Boolean(validationError) || draftUnchanged || isLoading}
                onClick={applyCustomRange}
                className={cn(
                  'h-10 rounded-xl px-4 text-sm font-semibold transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40',
                  isDark
                    ? 'bg-emerald-300 text-slate-950'
                    : 'bg-[#0a0a0a] text-white'
                )}
              >
                查询
              </button>
              {validationError ? (
                <span role="alert" className="text-sm font-medium text-[#d23f63]">
                  {validationError}
                </span>
              ) : null}
            </div>
          </div>
        </header>

        <div className="mt-8">
          {isLoading ? (
            <DetailSkeleton isDark={isDark} />
          ) : error ? (
            <DetailState
              isDark={isDark}
              icon={<AlertTriangle className="h-6 w-6" />}
              title="加载账号活动详情失败"
              description={error}
              action={
                <button
                  type="button"
                  onClick={() => setRetryKey((current) => current + 1)}
                  className={cn(
                    'inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold active:scale-[0.98]',
                    isDark
                      ? 'bg-emerald-300 text-slate-950'
                      : 'bg-[#0a0a0a] text-white'
                  )}
                >
                  <RefreshCw className="h-4 w-4" />
                  重试
                </button>
              }
            />
          ) : detail?.status === 'disabled' ? (
            <DetailState
              isDark={isDark}
              icon={<BarChart3 className="h-6 w-6" />}
              title="行为统计暂未启用"
              description="当前环境尚未启用行为统计，完成服务器配置后即可查看。"
            />
          ) : detail?.summary?.meaningful_events === 0 ? (
            <DetailState
              isDark={isDark}
              icon={<Activity className="h-6 w-6" />}
              title="这段时间没有活动"
              description={`${range.start} 至 ${range.end} 该账号没有留下活动记录。`}
            />
          ) : detail?.summary ? (
            <>
              <UserActivityDetail detail={detail} isDark={isDark} />
              <p className={cn('mt-4 text-right text-xs', muted)}>
                数据更新时间：{formatShortDateTime(detail.generated_at)} · 相同账号与日期范围 20 分钟内直接复用
              </p>
            </>
          ) : null}
        </div>
      </main>
    </div>
  )
}

function DetailSkeleton({ isDark }: { isDark: boolean }) {
  const panel = isDark
    ? 'border-slate-800 bg-slate-900'
    : 'border-[#e5e5e5] bg-white'

  return (
    <div
      role="status"
      aria-label="正在加载账号活动详情"
      className="animate-pulse space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className={cn('h-28 rounded-2xl border', panel)} />
        ))}
      </div>
      <div className={cn('h-64 rounded-2xl border', panel)} />
      <span className="sr-only">正在加载账号活动详情</span>
    </div>
  )
}

function DetailState({
  isDark,
  icon,
  title,
  description,
  action,
}: {
  isDark: boolean
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <section
      className={cn(
        'flex min-h-72 flex-col items-center justify-center rounded-2xl border px-6 text-center',
        isDark
          ? 'border-slate-800 bg-slate-900'
          : 'border-[#e5e5e5] bg-white'
      )}
    >
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-2xl',
          isDark
            ? 'bg-slate-800 text-emerald-300'
            : 'bg-[#f5f0e0] text-[#1a3a3a]'
        )}
      >
        {icon}
      </div>
      <h2
        className={cn(
          'mt-5 text-xl font-semibold',
          isDark ? 'text-slate-100' : 'text-[#0a0a0a]'
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          'mt-2 max-w-md text-sm leading-6',
          isDark ? 'text-slate-400' : 'text-[#6a6a6a]'
        )}
      >
        {description}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  )
}
