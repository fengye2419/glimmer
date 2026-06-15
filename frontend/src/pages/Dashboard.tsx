import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDashboard, STUDENT_KEY, forgetStudent, apiErrorMessage, type Dashboard } from '../api/client'
import SkillRadar from '../components/SkillRadar'
import MasteryTrend from '../components/MasteryTrend'
import ErrorState from '../components/ErrorState'
import { gradeLabel } from '../utils/format'

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()
  const studentId = localStorage.getItem(STUDENT_KEY)

  const load = useCallback(() => {
    if (!studentId) return
    setLoading(true)
    setError('')
    getDashboard(studentId)
      .then((r) => setData(r.data))
      .catch((e) => {
        setError(apiErrorMessage(e, '加载仪表盘失败'))
        if (axiosStatus(e) === 404) {
          forgetStudent()
        }
      })
      .finally(() => setLoading(false))
  }, [studentId])

  useEffect(() => {
    if (!studentId) {
      nav('/student/setup')
      return
    }
    load()
  }, [studentId, nav, load])

  if (loading) return <div className="loading">加载中…</div>
  if (error) return <ErrorState message={error} onRetry={() => (studentId ? load() : nav('/student/setup'))} />
  if (!data) return null

  const needsOnboarding = !data.stats.has_diagnosed

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>你好，{data.student.name}</h1>
          <p className="muted">数学 · 分数单元 · {gradeLabel(data.student.grade)} · 学习仪表盘</p>
        </div>
        <div className="status-badge">
          {data.ollama_healthy ? '🟢 AI 讲题在线' : '🟡 AI 离线（模板提示）'}
        </div>
      </header>

      {needsOnboarding ? (
        <section className="card hero-cta">
          <h2>👋 欢迎开始学习了</h2>
          <p>先完成 12 题诊断测评，系统才能精准定位你的知识漏洞。</p>
          <Link to="/student/diagnose" className="btn primary">开始诊断测评</Link>
        </section>
      ) : (
        <div className="stats-row">
          <div className="stat-chip">
            <span className="stat-value">{data.stats.total_attempts}</span>
            <span className="stat-label">累计答题</span>
          </div>
          <div className="stat-chip">
            <span className="stat-value">{Math.round(data.stats.accuracy * 100)}%</span>
            <span className="stat-label">正确率</span>
          </div>
          <div className="stat-chip">
            <span className="stat-value">{Math.round(data.stats.avg_mastery * 100)}%</span>
            <span className="stat-label">平均掌握度</span>
          </div>
        </div>
      )}

      <div className="action-grid">
        <Link to="/student/diagnose" className="action-card">
          <span className="action-icon">📋</span>
          <span>诊断测评</span>
          <small>12 题摸底，定位知识漏洞</small>
        </Link>
        <Link to="/student/practice" className="action-card">
          <span className="action-icon">✏️</span>
          <span>自适应练习</span>
          <small>按薄弱点智能推题</small>
        </Link>
      </div>

      {(data.due_reviews?.length ?? 0) > 0 && (
        <section className="card alert">
          <h3>📅 今日待复习</h3>
          <ul className="action-list">
            {data.due_reviews.map((d) => (
              <li key={d.skill_id}>
                <span>{d.skill_name}（第 {d.stage + 1} 轮复习）</span>
                <Link to="/student/practice" className="btn sm">去复习</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid-2">
        <section className="card">
          <h3>技能雷达图</h3>
          <SkillRadar data={data.mastery_map} />
        </section>
        <section className="card">
          <h3>7 天掌握度趋势</h3>
          <MasteryTrend data={data.trend} />
        </section>
      </div>

      {(data.weak_skills?.length ?? 0) > 0 && (
        <section className="card">
          <h3>薄弱技能 Top 3</h3>
          <div className="weak-list">
            {data.weak_skills.map((w) => (
              <div key={w.skill_id} className="weak-item">
                <span className="weak-name">{w.skill_name}</span>
                <div className="bar-track">
                  <div className="bar-fill weak" style={{ width: `${w.p_known * 100}%` }} />
                </div>
                <span className="weak-pct">{Math.round(w.p_known * 100)}%</span>
                <Link to="/student/practice" className="btn sm">练习</Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function axiosStatus(e: unknown) {
  if (typeof e === 'object' && e && 'response' in e) {
    return (e as { response?: { status?: number } }).response?.status
  }
  return undefined
}
