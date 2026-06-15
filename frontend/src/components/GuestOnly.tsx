import { Navigate, Outlet } from 'react-router-dom'
import { getCurrentUser, postLoginPath } from '../utils/auth'

export default function GuestOnly() {
  const user = getCurrentUser()
  if (user) {
    return <Navigate to={postLoginPath(user.role)} replace />
  }
  return <Outlet />
}
