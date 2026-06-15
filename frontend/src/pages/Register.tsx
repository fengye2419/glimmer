import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { register, postLoginPath } from '../utils/auth'
import { ROLES, type UserRole } from '../utils/roles'

export default function Register() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [role, setRole] = useState<UserRole>('parent')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('两次输入的密码不一致')
      return
    }
    setLoading(true)
    try {
      const user = register(name, email, password, role)
      nav(postLoginPath(user.role))
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="创建账号"
      subtitle="选择你的平台角色，获取对应功能权限"
      footer={
        <p>
          已有账号？<Link to="/login">去登录</Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={submit}>
        {error && <div className="auth-error">{error}</div>}

        <fieldset className="role-picker">
          <legend>我是…</legend>
          <div className="role-picker-grid">
            {ROLES.map((r) => (
              <label key={r.key} className={`role-picker-item${role === r.key ? ' active' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value={r.key}
                  checked={role === r.key}
                  onChange={() => setRole(r.key)}
                />
                <strong>{r.label}</strong>
                <span>{r.description}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="auth-field">
          <span>姓名</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="你的姓名或机构名称"
            autoComplete="name"
            required
          />
        </label>
        <label className="auth-field">
          <span>邮箱</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>
        <label className="auth-field">
          <span>密码</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 位"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>
        <label className="auth-field">
          <span>确认密码</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="再次输入密码"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>
        <button type="submit" className="btn primary auth-submit" disabled={loading}>
          {loading ? '注册中…' : '注册并进入'}
        </button>
      </form>
    </AuthLayout>
  )
}
