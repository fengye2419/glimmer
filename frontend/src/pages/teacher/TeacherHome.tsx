import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentUser } from '../../utils/auth'
import { listStudents, getDashboard, apiErrorMessage, type Student } from '../../api/client'
import { PortalHeader, StatGrid, FeatureList } from '../../components/PortalShell'
import ErrorState from '../../components/ErrorState'
import { gradeLabel } from '../../utils/format'

interface StudentRow extends Student {
  accuracy?: number
  mastery?: number
}

export default function TeacherHome() {
  const user = getCurrentUser()
  const [students, setStudents] = useState<StudentRow[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    listStudents()
      .then(async (r) => {
        const list = r.data.students || []
        const enriched = await Promise.all(
          list.map(async (s) => {
            try {
              const dash = await getDashboard(s.id)
              return {
                ...s,
                accuracy: Math.round(dash.data.stats.accuracy * 100),
                mastery: Math.round(dash.data.stats.avg_mastery * 100),
              }
            } catch {
              return { ...s }
            }
          }),
        )
        setStudents(enriched)
      })
      .catch((e) => setError(apiErrorMessage(e, '加载班级数据失败')))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="loading">加载中…</div>
  if (error) return <ErrorState message={error} onRetry={load} />

  const avgMastery = students.length
    ? Math.round(students.reduce((sum, s) => sum + (s.mastery ?? 0), 0) / students.length)
    : 0

  return (
    <div className="page portal-page">
      <PortalHeader
        title={`${user?.name || '老师'}的工作台`}
        subtitle="教师端 · 班级学情一览，布置测评与跟进薄弱点"
      />

      <StatGrid items={[
        { label: '学生数', value: String(students.length) },
        { label: '班级数', value: '1', hint: '五年级一班' },
        { label: '班级均掌握度', value: students.length ? `${avgMastery}%` : '—' },
      ]} />

      <FeatureList items={[
        { title: '班级管理', desc: '查看班级列表、课表与教学计划（演示）。', to: '/teacher/classes', action: '查看班级' },
        { title: '学生学情', desc: '按学生查看掌握度、薄弱技能与答题记录。', to: '/teacher/students', action: '学生列表' },
        { title: '布置诊断', desc: '为全班或指定学生发起诊断测评（即将上线）。' },
      ]} />

      <section className="card">
        <h3>需关注学生</h3>
        {students.length === 0 ? (
          <p className="muted">暂无学生数据</p>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>姓名</th><th>学段</th><th>掌握度</th><th>正确率</th></tr>
              </thead>
              <tbody>
                {students
                  .sort((a, b) => (a.mastery ?? 100) - (b.mastery ?? 100))
                  .slice(0, 5)
                  .map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{gradeLabel(s.grade)}</td>
                      <td>{s.mastery != null ? `${s.mastery}%` : '—'}</td>
                      <td>{s.accuracy != null ? `${s.accuracy}%` : '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        <Link to="/teacher/students" className="btn sm" style={{ marginTop: '0.75rem' }}>查看全部学生</Link>
      </section>
    </div>
  )
}
