import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listStudents, createStudent, rememberStudent, apiErrorMessage, type Student } from '../api/client'
import ErrorState from '../components/ErrorState'
import { gradeLabel, LEARNER_STAGES } from '../utils/format'
import { getCurrentUser } from '../utils/auth'
import { roleHome } from '../utils/roles'

export default function StudentSetup() {
  const [students, setStudents] = useState<Student[]>([])
  const [name, setName] = useState('')
  const [grade, setGrade] = useState(5)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()
  const user = getCurrentUser()

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    listStudents()
      .then((r) => setStudents(r.data.students || []))
      .catch((e) => setError(apiErrorMessage(e, '加载学习档案失败')))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const select = (id: string, studentName: string) => {
    rememberStudent(id, studentName)
    nav('/parent/dashboard')
  }

  const create = async () => {
    if (!name.trim() || creating) return
    setCreating(true)
    setError('')
    try {
      const r = await createStudent(name.trim(), grade)
      rememberStudent(r.data.id, r.data.name)
      nav('/parent/diagnose')
    } catch (e) {
      setError(apiErrorMessage(e, '创建学习档案失败'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page setup">
      <header className="setup-header">
        <h1>学习档案</h1>
        <p className="muted">
          {user ? `${user.name}，在本设备上选择或新建一位学习者档案` : '请选择或创建学习档案'}
        </p>
        <p className="muted small">同一账号可管理多位学习者（孩子 / 自己），当前体验内容：小学数学（分数单元）</p>
        <button type="button" className="btn ghost sm setup-back" onClick={() => nav(roleHome(user?.role || 'parent'))}>
          返回学习中心
        </button>
      </header>

      {error && <ErrorState message={error} onRetry={load} />}

      <section className="card">
        <h2>已有档案</h2>
        {loading && <p className="muted">加载中…</p>}
        {!loading && students.length === 0 && <p className="muted">还没有学习档案，请先创建</p>}
        <div className="student-list">
          {students.map((s) => (
            <button key={s.id} className="student-btn" onClick={() => select(s.id, s.name)}>
              <span className="student-name">{s.name}</span>
              <span className="student-grade">{gradeLabel(s.grade)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>新建学习档案</h2>
        <div className="form-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="学习者姓名"
            aria-label="学习者姓名"
          />
          <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} aria-label="学段">
            {LEARNER_STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button className="btn primary" onClick={create} disabled={!name.trim() || creating}>
            {creating ? '创建中…' : '创建并开始诊断'}
          </button>
        </div>
      </section>
    </div>
  )
}
