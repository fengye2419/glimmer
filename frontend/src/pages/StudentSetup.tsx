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
  const isParent = user?.role === 'parent'

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

  const afterSelect = () => {
    if (isParent) nav('/parent/reports')
    else nav('/student/dashboard')
  }

  const select = (id: string, studentName: string) => {
    rememberStudent(id, studentName)
    afterSelect()
  }

  const create = async () => {
    if (!name.trim() || creating) return
    setCreating(true)
    setError('')
    try {
      const r = await createStudent(name.trim(), grade)
      rememberStudent(r.data.id, r.data.name)
      if (isParent) nav('/parent/reports')
      else nav('/student/diagnose')
    } catch (e) {
      setError(apiErrorMessage(e, '创建学习档案失败'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page setup">
      <header className="setup-header">
        <h1>{isParent ? '管理孩子档案' : '选择学习档案'}</h1>
        <p className="muted">
          {user ? `${user.name}，${isParent ? '请为孩子创建或选择档案' : '请选择你的学习档案'}` : '请选择或创建学习档案'}
        </p>
        <p className="muted small">当前体验内容：小学数学（分数单元）</p>
        <button type="button" className="btn ghost sm setup-back" onClick={() => nav(roleHome(user?.role || 'student'))}>
          返回{isParent ? '家长' : '学习'}首页
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
        <h2>{isParent ? '新建孩子档案' : '新建学习档案'}</h2>
        <div className="form-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isParent ? '孩子姓名' : '学习者姓名'}
            aria-label="学习者姓名"
          />
          <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} aria-label="学段">
            {LEARNER_STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button className="btn primary" onClick={create} disabled={!name.trim() || creating}>
            {creating ? '创建中…' : isParent ? '创建档案' : '创建并开始诊断'}
          </button>
        </div>
      </section>
    </div>
  )
}
