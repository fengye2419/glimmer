import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentUser } from '../../utils/auth'
import { listStudents, getDashboard, STUDENT_KEY, apiErrorMessage, type Student } from '../../api/client'
import { PortalHeader, StatGrid, FeatureList } from '../../components/PortalShell'
import ErrorState from '../../components/ErrorState'
import { gradeLabel } from '../../utils/format'

export default function ParentHome() {
  const user = getCurrentUser()
  const [students, setStudents] = useState<Student[]>([])
  const [activeChild] = useState<string | null>(localStorage.getItem(STUDENT_KEY))
  const [summary, setSummary] = useState<{ accuracy: number; mastery: number; attempts: number } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    listStudents()
      .then(async (r) => {
        const list = r.data.students || []
        setStudents(list)
        const childId = activeChild || list[0]?.id
        if (childId) {
          const dash = await getDashboard(childId)
          setSummary({
            accuracy: Math.round(dash.data.stats.accuracy * 100),
            mastery: Math.round(dash.data.stats.avg_mastery * 100),
            attempts: dash.data.stats.total_attempts,
          })
        }
      })
      .catch((e) => setError(apiErrorMessage(e, '加载家庭学情失败')))
      .finally(() => setLoading(false))
  }, [activeChild])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="loading">加载中…</div>
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="page portal-page">
      <PortalHeader
        title={`你好，${user?.name || '家长'}`}
        subtitle="家长端 · 管理孩子学习档案，追踪成长进度"
        actions={<Link to="/parent/children" className="btn primary">管理孩子档案</Link>}
      />

      <StatGrid items={[
        { label: '孩子档案', value: String(students.length), hint: '已创建' },
        { label: '累计答题', value: summary ? String(summary.attempts) : '—' },
        { label: '平均掌握度', value: summary ? `${summary.mastery}%` : '—' },
      ]} />

      <FeatureList items={[
        {
          title: '孩子档案管理',
          desc: '创建或切换孩子的学习档案，支持全龄段学习者。',
          to: '/parent/children',
          action: '管理档案',
        },
        {
          title: '学情报告',
          desc: '查看诊断结果、薄弱技能与掌握度趋势，获取 AI 学习建议。',
          to: '/parent/reports',
          action: '查看报告',
        },
        {
          title: '学习任务',
          desc: '为孩子安排诊断测评或练习（即将支持家长布置任务）。',
        },
      ]} />

      {students.length > 0 && (
        <section className="card">
          <h3>我的孩子</h3>
          <div className="student-list">
            {students.map((s) => (
              <Link key={s.id} to="/parent/reports" className="student-btn student-btn-link" onClick={() => localStorage.setItem(STUDENT_KEY, s.id)}>
                <span className="student-name">{s.name}</span>
                <span className="student-grade">{gradeLabel(s.grade)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
