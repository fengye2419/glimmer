import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { roleLabel, roleBadgeClass } from '../utils/roles'
import type { UserRole } from '../utils/roles'

export function RoleBadge({ role }: { role: UserRole }) {
  return <span className={roleBadgeClass(role)}>{roleLabel(role)}</span>
}

export function PortalHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <header className="portal-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {actions}
    </header>
  )
}

export function StatGrid({ items }: { items: { label: string; value: string; hint?: string }[] }) {
  return (
    <div className="stats-row">
      {items.map((item) => (
        <div key={item.label} className="stat-chip">
          <span className="stat-value">{item.value}</span>
          <span className="stat-label">{item.label}</span>
          {item.hint && <span className="stat-hint">{item.hint}</span>}
        </div>
      ))}
    </div>
  )
}

export function FeatureList({ items }: { items: { title: string; desc: string; to?: string; action?: string }[] }) {
  return (
    <div className="portal-feature-list">
      {items.map((item) => (
        <article key={item.title} className="portal-feature-item card">
          <div>
            <h3>{item.title}</h3>
            <p className="muted">{item.desc}</p>
          </div>
          {item.to && (
            <Link to={item.to} className="btn sm primary">{item.action || '进入'}</Link>
          )}
        </article>
      ))}
    </div>
  )
}
