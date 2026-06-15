import { Navigate, Outlet } from 'react-router-dom'
import { getCurrentUser } from '../utils/auth'
import type { UserRole } from '../utils/roles'
import { roleHome } from '../utils/roles'

interface RequireRoleProps {
  roles: UserRole[]
}

export default function RequireRole({ roles }: RequireRoleProps) {
  const user = getCurrentUser()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (!roles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />
  }
  return <Outlet />
}
