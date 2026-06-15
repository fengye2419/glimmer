import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { DEMO_ACCOUNTS, login, loginDemo, postLoginPath } from '../utils/auth'
import { roleLabel } from '../utils/roles'

export default function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const goNext = (account: ReturnType<typeof login>) => {
    nav(postLoginPath(account.role))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      goNext(login(email, password))
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const useDemo = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setError('')
    setLoading(true)
    try {
      goNext(loginDemo(account))
    } catch (err) {
      setError(err instanceof Error ? err.message : '演示登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="欢迎回来"
      subtitle="选择你的角色身份，进入对应工作台"
      footer={
        <p>
          还没有账号？<Link to="/register">立即注册</Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={submit}>
        {error && <div className="auth-error">{error}</div>}
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
            placeholder="请输入密码"
            autoComplete="current-password"
            required
          />
        </label>
        <button type="submit" className="btn primary auth-submit" disabled={loading}>
          {loading ? '登录中…' : '登录'}
        </button>
      </form>

      <div className="auth-demo">
        <p className="auth-demo-title">五类角色演示账号（一键登录）</p>
        <div className="auth-demo-list">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              className="auth-demo-btn"
              disabled={loading}
              onClick={() => useDemo(account)}
            >
              <span className="auth-demo-name">{account.name}</span>
              <span className="auth-demo-meta">{roleLabel(account.role)} · {account.email}</span>
            </button>
          ))}
        </div>
        <p className="auth-demo-hint">密码均为 <code>demo123456</code></p>
      </div>
    </AuthLayout>
  )
}
