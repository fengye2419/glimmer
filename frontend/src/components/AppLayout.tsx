import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { RoleBadge } from './PortalShell'
import { STUDENT_KEY, STUDENT_NAME_KEY } from '../api/client'
import { getCurrentUser, logout } from '../utils/auth'
import { roleHome, roleNavLinks, roleLabel } from '../utils/roles'

export default function AppLayout() {
  const nav = useNavigate()
  const user = getCurrentUser()
  if (!user) return null

  const hasStudent = !!localStorage.getItem(STUDENT_KEY)
  const studentName = localStorage.getItem(STUDENT_NAME_KEY) || ''
  const links = roleNavLinks(user.role)
  const home = roleHome(user.role)
  const setupPath = user.role === 'parent' ? '/parent/children' : '/student/setup'

  const handleLogout = () => {
    logout()
    localStorage.removeItem(STUDENT_KEY)
    localStorage.removeItem(STUDENT_NAME_KEY)
    nav('/')
  }

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <Link to={home} className="nav-brand">
          <span className="brand-mark">✦</span>
          <span>微光 Glimmer</span>
          <span className="brand-sub">全学科 · 全龄段</span>
        </Link>

        <div className="app-topbar-right">
          {(user.role === 'parent' || user.role === 'student') && studentName && (
            <span className="nav-student">
              <span className="avatar">{[...studentName][0]}</span>
              {studentName}
            </span>
          )}
          {(user.role === 'parent' || user.role === 'student') && hasStudent && (
            <Link to={setupPath} className="btn ghost sm">切换档案</Link>
          )}
          <div className="app-user-menu">
            <RoleBadge role={user.role} />
            <span className="nav-user">{user.name}</span>
          </div>
          <button type="button" className="btn ghost sm" onClick={handleLogout}>退出</button>
        </div>
      </header>

      <div className="app-body">
        <aside className="app-sidebar">
          <div className="sidebar-section">
            <span className="sidebar-label">{roleLabel(user.role)}工作台</span>
          </div>
          <nav className="sidebar-nav">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === home}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <span className="sidebar-icon">{l.icon}</span>
                <span className="sidebar-text">{l.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
