import { Navigate, Outlet } from 'react-router-dom'
import { isLoggedIn } from '../utils/auth'

export default function RequireAuth() {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
