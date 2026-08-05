// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import {
  MemoryRouter,
  Route,
  Routes,
  useParams,
} from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getActivity } = vi.hoisted(() => ({
  getActivity: vi.fn(),
}))

vi.mock('./AdminActivityPage', () => ({
  default: () => {
    getActivity()
    return <div>aggregate dashboard</div>
  },
}))

import AdminActivityRoute from './AdminActivityRoute'

function DetailTarget() {
  const { userId } = useParams()
  return <div>detail {userId}</div>
}

function renderRoute(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin/activity" element={<AdminActivityRoute />} />
        <Route path="/admin/activity/user/:userId" element={<DetailTarget />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AdminActivityRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects legacy user bookmarks before rendering the aggregate dashboard', async () => {
    renderRoute('/admin/activity?user=learner%2Fone')

    expect(await screen.findByText('detail learner/one')).toBeDefined()
    expect(getActivity).not.toHaveBeenCalled()
  })

  it('renders the aggregate dashboard when no legacy user query is present', () => {
    renderRoute('/admin/activity')

    expect(screen.getByText('aggregate dashboard')).toBeDefined()
    expect(getActivity).toHaveBeenCalledTimes(1)
  })
})
