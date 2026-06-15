import { useCallback, useEffect, useState } from 'react'
import { listStudents, getDashboard, apiErrorMessage, type Student } from '../../api/client'
import { PortalHeader } from '../../components/PortalShell'
import ErrorState from '../../components/ErrorState'
import { gradeLabel } from '../../utils/format'

interface StudentRow extends Student {
  accuracy?: number
  mastery?: number
  attempts?: number
}

export default function TeacherStudents() {
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
                attempts: dash.data.stats.total_attempts,
              }
            } catch {
              return { ...s }
            }
          }),
        )
        setStudents(enriched)
      })
      .catch((e) => setError(apiErrorMessage(e, '加载学生列表失败')))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="loading">加载中…</div>
  if (error) return <ErrorState message={error} onRetry={load} />

  return (
    <div className="page portal-page">
      <PortalHeader title="学生学情" subtitle="教师端 · 查看每位学生的掌握度与练习情况" />
      <section className="card">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>姓名</th><th>学段</th><th>答题数</th><th>正确率</th><th>掌握度</th><th>状态</th></tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{gradeLabel(s.grade)}</td>
                  <td>{s.attempts ?? '—'}</td>
                  <td>{s.accuracy != null ? `${s.accuracy}%` : '—'}</td>
                  <td>{s.mastery != null ? `${s.mastery}%` : '—'}</td>
                  <td>{(s.mastery ?? 0) < 60 ? '需辅导' : '正常'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
