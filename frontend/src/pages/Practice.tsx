import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getPracticeNext,
  submitPractice,
  STUDENT_KEY,
  apiErrorMessage,
  type PracticeNext,
  type SubmitResult,
} from '../api/client'
import QuestionCard from '../components/QuestionCard'
import RootCauseChain from '../components/RootCauseChain'
import MasteryDelta from '../components/MasteryDelta'
import ErrorState from '../components/ErrorState'
import { practiceReasonLabel } from '../utils/format'

export default function PracticePage() {
  const [question, setQuestion] = useState<PracticeNext | null>(null)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(0)
  const [pageError, setPageError] = useState('')
  const [initLoading, setInitLoading] = useState(true)
  const nextBtnRef = useRef<HTMLButtonElement>(null)
  const nav = useNavigate()
  const studentId = localStorage.getItem(STUDENT_KEY)!

  useEffect(() => {
    if (result) nextBtnRef.current?.focus()
  }, [result])

  const loadNext = useCallback(() => {
    setInitLoading(true)
    setPageError('')
    getPracticeNext(studentId)
      .then((r) => setQuestion(r.data))
      .catch((e) => setPageError(apiErrorMessage(e, '加载题目失败')))
      .finally(() => setInitLoading(false))
  }, [studentId])

  useEffect(() => {
    if (!studentId) {
      nav('/')
      return
    }
    loadNext()
  }, [studentId, nav, loadNext])

  const handleSubmit = async (answer: string, durationMs: number) => {
    if (!question) return
    setLoading(true)
    try {
      const r = await submitPractice(studentId, {
        question_id: question.id,
        answer,
        duration_ms: durationMs,
      })
      setResult(r.data)
      setCount((c) => c + 1)
    } catch (e) {
      setResult({
        correct: false,
        feedback: apiErrorMessage(e, '提交失败'),
        updated_skills: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const next = () => {
    setResult(null)
    loadNext()
  }

  if (initLoading && !question) return <div className="loading">智能选题中…</div>
  if (pageError && !question) return <ErrorState message={pageError} onRetry={loadNext} />
  if (!question) return <ErrorState message="暂无可用练习题" onRetry={loadNext} />

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>自适应练习</h1>
          <p className="reason-badge">
            {practiceReasonLabel(question.reason, question.target_skill_name)}
          </p>
        </div>
        <span className="muted">已完成 {count} 题</span>
      </header>

      {!result ? (
        <QuestionCard
          key={question.id}
          stem={question.stem}
          difficulty={question.difficulty}
          index={count}
          total={count + 1}
          onSubmit={handleSubmit}
          loading={loading}
        />
      ) : (
        <>
          <div className={`feedback ${result.correct ? 'correct' : 'wrong'}`}>
            <p>{result.feedback}</p>
            <MasteryDelta skills={result.updated_skills} />
            {!result.correct && <RootCauseChain causes={result.root_causes || []} />}
          </div>
          <div className="btn-row">
            <button ref={nextBtnRef} className="btn primary" onClick={next}>下一题</button>
            {!result.correct && (
              <Link to={`/tutor/${question.id}`} className="btn">AI 引导讲题</Link>
            )}
            <Link to="/dashboard" className="btn ghost">回仪表盘</Link>
          </div>
        </>
      )}
    </div>
  )
}
