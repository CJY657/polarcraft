// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getActivity, getActivityDetail } = vi.hoisted(() => ({
  getActivity: vi.fn(),
  getActivityDetail: vi.fn(),
}))

vi.mock('@/lib/admin-user.service', () => ({
  adminUserApi: { getActivity, getActivityDetail },
}))

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light' }),
}))

vi.mock('@/components/shared/PersistentHeader', () => ({
  PersistentHeader: ({ moduleName }: { moduleName?: string }) => <div>{moduleName}</div>,
}))

import AdminUserActivityPage from './AdminUserActivityPage'

function toDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function presetRange(days: number) {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - (days - 1))
  return { start: toDateInput(start), end: toDateInput(end) }
}

const detail = {
  status: 'ok' as const,
  username: 'learner-account',
  display_name: '林晓光',
  user_type: 'student' as const,
  range: { ...presetRange(30), days: 30 },
  previous_range: { start: '2026-06-07', end: '2026-07-06', days: 30 },
  generated_at: '2026-08-05T08:00:00.000Z',
  last_activity: '2026-08-05T07:30:00.000Z',
  summary: {
    meaningful_events: 32,
    pageviews: 12,
    learning_actions: 20,
    active_days: 2,
    average_meaningful_events_per_active_day: 16,
    learning_action_rate: 62.5,
  },
  previous_summary: {
    meaningful_events: 16,
    pageviews: 10,
    learning_actions: 8,
    active_days: 1,
    average_meaningful_events_per_active_day: 16,
    learning_action_rate: 50,
  },
  daily: [
    { date: '2026-08-04', events: 12, pageviews: 5, learning_actions: 7 },
    { date: '2026-08-05', events: 20, pageviews: 7, learning_actions: 13 },
  ],
  top_pages: [{ path: '/experiments/calcite', pageviews: 9 }],
  module_breakdown: [
    { module: 'module1', label: '实验内容', pageviews: 9, active_days: 2 },
    { module: 'module2', label: '偏振挑战', pageviews: 0, active_days: 0 },
    { module: 'module3', label: '理论模拟', pageviews: 0, active_days: 0 },
    { module: 'module4', label: '游戏挑战', pageviews: 0, active_days: 0 },
    { module: 'module5', label: '成果展示', pageviews: 0, active_days: 0 },
    { module: 'module6', label: '虚拟课题', pageviews: 0, active_days: 0 },
  ],
  hourly: [{ weekday: 3, hour: 15, count: 6 }],
}

function renderPage(
  initialEntries: string[] = ['/admin/activity/user/learner-1'],
  initialIndex = initialEntries.length - 1
) {
  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      <Routes>
        <Route path="/admin/users" element={<div>用户管理返回目标</div>} />
        <Route path="/admin/activity/user/:userId" element={<ActivityTestRoute />} />
      </Routes>
    </MemoryRouter>
  )
}

function ActivityTestRoute() {
  const navigate = useNavigate()
  return (
    <>
      <AdminUserActivityPage />
      <button
        type="button"
        onClick={() => navigate('/admin/activity/user/learner-2')}
      >
        切换测试用户
      </button>
    </>
  )
}

describe('AdminUserActivityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getActivityDetail.mockResolvedValue(detail)
  })

  it('loads only the 30-day user detail and renders identity, KPIs, module shares and active days', async () => {
    renderPage()

    await waitFor(() =>
      expect(getActivityDetail).toHaveBeenCalledWith('learner-1', presetRange(30))
    )
    expect(getActivity).not.toHaveBeenCalled()
    expect(await screen.findByRole('heading', { name: '林晓光' })).toBeDefined()
    expect(screen.getByText(/账号 learner-account/)).toBeDefined()
    expect(screen.getByText('学生')).toBeDefined()
    expect(screen.getByRole('button', { name: '30 天' }).getAttribute('aria-pressed')).toBe('true')
    for (const days of [7, 30, 90, 180, 365]) {
      expect(screen.getByRole('button', { name: `${days} 天` })).toBeDefined()
    }

    const metrics = screen.getByLabelText('账号活动指标')
    expect(within(metrics).getByText('2 天')).toBeDefined()
    expect(within(metrics).getAllByText('16 次').length).toBeGreaterThanOrEqual(1)
    expect(within(metrics).getByText('62.5%')).toBeDefined()
    expect(screen.getByText(/六大模块覆盖 9 \/ 12 次页面访问（75%）/)).toBeDefined()
    expect(screen.getByText('9 次 · 2 天 · 75%')).toBeDefined()
  })

  it('applies preset ranges immediately', async () => {
    renderPage()
    await waitFor(() => expect(getActivityDetail).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole('button', { name: '90 天' }))

    await waitFor(() =>
      expect(getActivityDetail).toHaveBeenLastCalledWith('learner-1', presetRange(90))
    )
  })

  it('keeps custom edits as draft state until 查询 is clicked', async () => {
    renderPage()
    await waitFor(() => expect(getActivityDetail).toHaveBeenCalledTimes(1))
    getActivityDetail.mockClear()

    fireEvent.change(screen.getByLabelText('开始日期'), {
      target: { value: '2026-07-01' },
    })
    fireEvent.change(screen.getByLabelText('结束日期'), {
      target: { value: '2026-07-31' },
    })

    expect(getActivityDetail).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '查询自定义日期' }))

    await waitFor(() =>
      expect(getActivityDetail).toHaveBeenCalledWith('learner-1', {
        start: '2026-07-01',
        end: '2026-07-31',
      })
    )
  })

  it('rejects inverted and over-366-day draft ranges without requesting data', async () => {
    renderPage()
    await waitFor(() => expect(getActivityDetail).toHaveBeenCalledTimes(1))
    getActivityDetail.mockClear()

    fireEvent.change(screen.getByLabelText('开始日期'), {
      target: { value: '2026-07-31' },
    })
    fireEvent.change(screen.getByLabelText('结束日期'), {
      target: { value: '2026-07-01' },
    })
    expect(screen.getByRole('alert').textContent).toContain('开始日期不能晚于结束日期')
    expect(
      screen.getByRole('button', { name: '查询自定义日期' }).hasAttribute('disabled')
    ).toBe(true)

    fireEvent.change(screen.getByLabelText('开始日期'), {
      target: { value: '2025-01-01' },
    })
    fireEvent.change(screen.getByLabelText('结束日期'), {
      target: { value: '2026-08-05' },
    })
    expect(screen.getByRole('alert').textContent).toContain('时间跨度不能超过 366 天')
    expect(getActivityDetail).not.toHaveBeenCalled()
    expect(screen.getByLabelText('结束日期').getAttribute('max')).toBe('2026-08-05')

    fireEvent.change(screen.getByLabelText('开始日期'), {
      target: { value: '2026-08-05' },
    })
    fireEvent.change(screen.getByLabelText('结束日期'), {
      target: { value: '2026-08-06' },
    })
    expect(screen.getByRole('alert').textContent).toContain('日期不能晚于今天')
    expect(getActivityDetail).not.toHaveBeenCalled()
  })

  it('shows loading, disabled and zero-activity states', async () => {
    getActivityDetail.mockReturnValueOnce(new Promise(() => undefined))
    const loading = renderPage()
    expect(screen.getByLabelText('正在加载账号活动详情')).toBeDefined()
    loading.unmount()

    getActivityDetail.mockResolvedValueOnce({ ...detail, status: 'disabled', summary: null })
    const disabled = renderPage()
    expect(await screen.findByText('行为统计暂未启用')).toBeDefined()
    disabled.unmount()

    getActivityDetail.mockResolvedValueOnce({
      ...detail,
      summary: {
        meaningful_events: 0,
        pageviews: 0,
        learning_actions: 0,
        active_days: 0,
        average_meaningful_events_per_active_day: 0,
        learning_action_rate: 0,
      },
    })
    renderPage()
    expect(await screen.findByText('这段时间没有活动')).toBeDefined()
  })

  it('retries a failed detail request', async () => {
    getActivityDetail
      .mockRejectedValueOnce(new Error('行为数据查询失败，请稍后重试'))
      .mockResolvedValueOnce(detail)
    renderPage()

    expect(await screen.findByText('加载账号活动详情失败')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: '重试' }))

    await waitFor(() => expect(getActivityDetail).toHaveBeenCalledTimes(2))
    expect(await screen.findByRole('heading', { name: '林晓光' })).toBeDefined()
  })

  it('returns to the previous admin view', async () => {
    renderPage(['/admin/users', '/admin/activity/user/learner-1'])
    await screen.findByRole('heading', { name: '林晓光' })

    fireEvent.click(screen.getByRole('button', { name: '返回上一页' }))

    expect(await screen.findByText('用户管理返回目标')).toBeDefined()
  })

  it('clears the previous identity while a different route user is loading', async () => {
    getActivityDetail
      .mockResolvedValueOnce(detail)
      .mockReturnValueOnce(new Promise(() => undefined))
    renderPage()
    await screen.findByRole('heading', { name: '林晓光' })

    fireEvent.click(screen.getByRole('button', { name: '切换测试用户' }))

    await waitFor(() =>
      expect(getActivityDetail).toHaveBeenLastCalledWith('learner-2', presetRange(30))
    )
    expect(screen.getByLabelText('正在加载账号活动详情')).toBeDefined()
    expect(screen.queryByRole('heading', { name: '林晓光' })).toBeNull()
    expect(screen.queryByText(/账号 learner-account/)).toBeNull()
  })
})
