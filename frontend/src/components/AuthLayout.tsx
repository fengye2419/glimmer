import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <Link to="/" className="auth-brand">
          <span className="brand-mark">✦</span>
          <span>微光 Glimmer</span>
        </Link>

        <div className="auth-card">
          <header className="auth-header">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </header>
          {children}
        </div>

        {footer && <footer className="auth-footer">{footer}</footer>}
      </div>
    </div>
  )
}
