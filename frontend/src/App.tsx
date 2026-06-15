import { BrowserRouter, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Diagnose from './pages/Diagnose'
import Practice from './pages/Practice'
import Tutor from './pages/Tutor'
import { STUDENT_KEY, STUDENT_NAME_KEY } from './api/client'
import './App.css'

function Nav() {
  const loc = useLocation()
  const hasStudent = !!localStorage.getItem(STUDENT_KEY)
  const studentName = localStorage.getItem(STUDENT_NAME_KEY) || ''
  if (loc.pathname === '/') return null

  const links = [
    { to: '/dashboard', label: '仪表盘' },
    { to: '/diagnose', label: '诊断' },
    { to: '/practice', label: '练习' },
  ]

  return (
    <nav className="nav">
      <Link to="/dashboard" className="nav-brand">
        <span className="brand-mark">✦</span>
        <span>微光 Glimmer</span>
        <span className="brand-sub">AI 学习伙伴</span>
      </Link>
      <div className="nav-links">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            {l.label}
          </NavLink>
        ))}
      </div>
      <div className="nav-right">
        {studentName && (
          <span className="nav-student">
            <span className="avatar">{[...studentName][0]}</span>
            {studentName}
          </span>
        )}
        {hasStudent && <NavLink to="/" className="nav-switch btn ghost sm">切换</NavLink>}
      </div>
    </nav>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Nav />
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/diagnose" element={<Diagnose />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/tutor/:questionId" element={<Tutor />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
