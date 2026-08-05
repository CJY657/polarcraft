import { Navigate, useSearchParams } from 'react-router-dom'

import AdminActivityPage from './AdminActivityPage'

export default function AdminActivityRoute() {
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('user')

  if (userId) {
    return (
      <Navigate
        to={`/admin/activity/user/${encodeURIComponent(userId)}`}
        replace
      />
    )
  }

  return <AdminActivityPage />
}
