import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listStudents, createStudent, rememberStudent, apiErrorMessage, type Student } from '../api/client'
import ErrorState from '../components/ErrorState'
import { gradeLabel } from '../utils/format'

export default function Home() {
  const [students, setStudents] = useState<Student[]>([])
  const [name, setName] = useState('')
  const [grade, setGrade] = useState(5)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    listStudents()
      .then((r) => setStudents(r.data.students || []))
      .catch((e) => setError(apiErrorMessage(e, '加载学生列表失败')))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const select = (id: string, studentName: string) => {
    rememberStudent(id, studentName)
    nav('/dashboard')
  }

  const create = async () => {
    if (!name.trim() || creating) return
    setCreating(true)
    setError('')
    try {
      const r = await createStudent(name.trim(), grade)
      rememberStudent(r.data.id, r.data.name)
      nav('/diagnose')
    } catch (e) {
      setError(apiErrorMessage(e, '创建学生失败'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page home">
      <header className="hero">
        <h1>微光 Glimmer</h1>
        <p>苏格拉底式 AI 学习伙伴 · 当前单元：小学数学（分数）</p>
        <p className="subtitle">诊断 → 引导讲题 → 自适应练习</p>
      </header>

      <section className="card steps-card">
        <h2>学习流程</h2>
        <ol className="steps-list">
          <li><strong>诊断测评</strong> — 12 题摸底，定位知识漏洞</li>
          <li><strong>AI 引导讲题</strong> — 苏格拉底式提问，不直接给答案</li>
          <li><strong>自适应练习</strong> — 按薄弱点智能推题与复习</li>
        </ol>
      </section>

      {error && <ErrorState message={error} onRetry={load} />}

      <section className="card">
        <h2>选择学生</h2>
        {loading && <p className="muted">加载中…</p>}
        {!loading && students.length === 0 && <p className="muted">还没有学生档案，请先创建</p>}
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
        <h2>新建学生</h2>
        <div className="form-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="学生姓名"
            aria-label="学生姓名"
          />
          <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} aria-label="年级">
            <option value={4}>四年级</option>
            <option value={5}>五年级</option>
          </select>
          <button className="btn primary" onClick={create} disabled={!name.trim() || creating}>
            {creating ? '创建中…' : '创建并开始诊断'}
          </button>
        </div>
      </section>
    </div>
  )
}
