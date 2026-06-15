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
        subtitle="学习中心 · 在本设备上管理学习者档案，陪伴诊断、练习与 AI 讲题"
        actions={<Link to="/parent/children" className="btn primary">选择 / 新建学习者</Link>}
      />

      <StatGrid items={[
        { label: '学习者档案', value: String(students.length), hint: '已创建' },
        { label: '累计答题', value: summary ? String(summary.attempts) : '—' },
        { label: '平均掌握度', value: summary ? `${summary.mastery}%` : '—' },
      ]} />

      <FeatureList items={[
        {
          title: '学习档案管理',
          desc: '创建或切换学习者档案，一个账号可管理孩子或自己，支持全龄段。',
          to: '/parent/children',
          action: '管理档案',
        },
        {
          title: '学情仪表盘',
          desc: '查看诊断结果、薄弱技能与掌握度趋势，获取 AI 学习建议。',
          to: '/parent/dashboard',
          action: '查看学情',
        },
        {
          title: '诊断 / 练习',
          desc: '先做 12 题诊断定位漏洞，再按薄弱点自适应练习并随时 AI 讲题。',
          to: '/parent/diagnose',
          action: '开始诊断',
        },
      ]} />

      {students.length > 0 && (
        <section className="card">
          <h3>学习者档案</h3>
          <p className="muted small">点击进入对应学习者的学情仪表盘</p>
          <div className="student-list">
            {students.map((s) => (
              <Link key={s.id} to="/parent/dashboard" className="student-btn student-btn-link" onClick={() => localStorage.setItem(STUDENT_KEY, s.id)}>
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
