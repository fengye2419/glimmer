import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  startDiagnose,
  submitDiagnose,
  STUDENT_KEY,
  apiErrorMessage,
  type QuestionBrief,
  type RootCause,
  type SubmitResult,
} from '../api/client'
import QuestionCard from '../components/QuestionCard'
import RootCauseChain from '../components/RootCauseChain'
import MasteryDelta from '../components/MasteryDelta'
import ProgressBar from '../components/ProgressBar'
import ErrorState from '../components/ErrorState'
import { dedupeCauses } from '../utils/format'

export default function DiagnosePage() {
  const [questions, setQuestions] = useState<QuestionBrief[]>([])
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [allCauses, setAllCauses] = useState<RootCause[]>([])
  const [pageError, setPageError] = useState('')
  const [initLoading, setInitLoading] = useState(true)
  const nextBtnRef = useRef<HTMLButtonElement>(null)
  const nav = useNavigate()
  const studentId = localStorage.getItem(STUDENT_KEY)!

  useEffect(() => {
    if (result) nextBtnRef.current?.focus()
  }, [result])

  const load = useCallback(() => {
    setInitLoading(true)
    setPageError('')
    startDiagnose(studentId)
      .then((r) => setQuestions(r.data.questions || []))
      .catch((e) => setPageError(apiErrorMessage(e, '加载诊断题失败')))
      .finally(() => setInitLoading(false))
  }, [studentId])

  useEffect(() => {
    if (!studentId) {
      nav('/parent/children')
      return
    }
    load()
  }, [studentId, nav, load])

  const handleSubmit = async (answer: string, durationMs: number) => {
    setLoading(true)
    setResult(null)
    try {
      const r = await submitDiagnose(studentId, {
        question_id: questions[index].id,
        answer,
        duration_ms: durationMs,
      })
      setResult(r.data)
      if (r.data.root_causes?.length) {
        setAllCauses((prev) => dedupeCauses([...prev, ...r.data.root_causes!]))
      }
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

  const goNext = () => {
    if (index + 1 >= questions.length) {
      setDone(true)
    } else {
      setIndex((i) => i + 1)
      setResult(null)
    }
  }

  if (initLoading) return <div className="loading">准备诊断题…</div>
  if (pageError) return <ErrorState message={pageError} onRetry={load} />
  if (!questions.length) return <ErrorState message="暂无诊断题目" onRetry={load} />

  if (done) {
    return (
      <div className="page">
        <h1>🎉 诊断完成</h1>
        <p>已完成 {questions.length} 题测评。以下是检测到的知识漏洞：</p>
        {allCauses.length > 0 ? (
          <RootCauseChain causes={allCauses} />
        ) : (
          <div className="card success-card">
            <p>表现不错！暂未发现明显薄弱点，可以继续练习巩固。</p>
          </div>
        )}
        <div className="btn-row">
          <button className="btn primary" onClick={() => nav('/parent/dashboard')}>查看仪表盘</button>
          <button className="btn" onClick={() => nav('/parent/practice')}>开始针对性练习</button>
        </div>
      </div>
    )
  }

  const currentQ = questions[index]

  return (
    <div className="page">
      <h1>诊断测评</h1>
      <p className="muted">做几道题，精准定位知识漏洞（不是简单错题本）</p>
      <ProgressBar current={index} total={questions.length} />

      {!result ? (
        <QuestionCard
          stem={currentQ.stem}
          difficulty={currentQ.difficulty}
          index={index}
          total={questions.length}
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
            <button ref={nextBtnRef} className="btn primary" onClick={goNext}>
              {index + 1 >= questions.length ? '查看诊断报告' : '下一题'}
            </button>
            {!result.correct && (
              <Link to={`/parent/tutor/${currentQ.id}`} className="btn">AI 引导讲题</Link>
            )}
          </div>
        </>
      )}
    </div>
  )
}
