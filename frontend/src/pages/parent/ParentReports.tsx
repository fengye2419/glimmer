import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDashboard, STUDENT_KEY, STUDENT_NAME_KEY, forgetStudent, apiErrorMessage } from '../../api/client'
import SkillRadar from '../../components/SkillRadar'
import MasteryTrend from '../../components/MasteryTrend'
import ErrorState from '../../components/ErrorState'
import { PortalHeader } from '../../components/PortalShell'
import { gradeLabel } from '../../utils/format'

export default function ParentReports() {
  const nav = useNavigate()
  const studentId = localStorage.getItem(STUDENT_KEY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<Awaited<ReturnType<typeof getDashboard>>['data'] | null>(null)

  useEffect(() => {
    if (!studentId) {
      nav('/parent/children')
      return
    }
    setLoading(true)
    getDashboard(studentId)
      .then((r) => {
        setData(r.data)
        localStorage.setItem(STUDENT_NAME_KEY, r.data.student.name)
      })
      .catch((e) => {
        setError(apiErrorMessage(e, '加载学情报告失败'))
        forgetStudent()
      })
      .finally(() => setLoading(false))
  }, [studentId, nav])

  if (!studentId) return null
  if (loading) return <div className="loading">加载报告…</div>
  if (error) return <ErrorState message={error} onRetry={() => nav('/parent/children')} />
  if (!data) return null

  return (
    <div className="page portal-page">
      <PortalHeader
        title={`${data.student.name} 的学情报告`}
        subtitle={`${gradeLabel(data.student.grade)} · 家长端只读视图`}
        actions={<Link to="/parent/children" className="btn ghost sm">切换孩子</Link>}
      />

      <div className="stats-row">
        <div className="stat-chip"><span className="stat-value">{data.stats.total_attempts}</span><span className="stat-label">累计答题</span></div>
        <div className="stat-chip"><span className="stat-value">{Math.round(data.stats.accuracy * 100)}%</span><span className="stat-label">正确率</span></div>
        <div className="stat-chip"><span className="stat-value">{Math.round(data.stats.avg_mastery * 100)}%</span><span className="stat-label">掌握度</span></div>
      </div>

      <div className="grid-2">
        <section className="card"><h3>技能雷达</h3><SkillRadar data={data.mastery_map} /></section>
        <section className="card"><h3>掌握度趋势</h3><MasteryTrend data={data.trend} /></section>
      </div>

      {(data.weak_skills?.length ?? 0) > 0 && (
        <section className="card">
          <h3>需关注的薄弱技能</h3>
          <ul className="action-list">
            {data.weak_skills.map((w) => (
              <li key={w.skill_id}><span>{w.skill_name}</span><span className="muted">{Math.round(w.p_known * 100)}%</span></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
