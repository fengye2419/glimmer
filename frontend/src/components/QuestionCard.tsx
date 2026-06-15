import { useState, useEffect, useRef } from 'react'
import MathText from './MathText'
import MathAnswerInput from './MathAnswerInput'

interface Props {
  stem: string
  difficulty: number
  index: number
  total: number
  onSubmit: (answer: string, durationMs: number) => void
  loading?: boolean
}

export default function QuestionCard({ stem, difficulty, index, total, onSubmit, loading }: Props) {
  const [answer, setAnswer] = useState('')
  const startRef = useRef(Date.now())

  useEffect(() => {
    startRef.current = Date.now()
    setAnswer('')
  }, [stem])

  const handleSubmit = () => {
    if (!answer.trim() || loading) return
    const duration = Date.now() - startRef.current
    onSubmit(answer.trim(), duration)
  }

  return (
    <div className="question-card">
      <div className="question-meta">
        <span>第 {index + 1}/{total} 题</span>
        <span>·</span>
        <span className="difficulty-dots" aria-label={`难度 ${difficulty}/5`} title={`难度 ${difficulty}/5`}>
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`dot ${i < difficulty ? 'on' : ''}`} />
          ))}
        </span>
      </div>
      <div className="question-stem">
        <MathText text={stem} />
      </div>
      <MathAnswerInput
        resetKey={stem}
        disabled={loading}
        onChange={setAnswer}
        onSubmit={handleSubmit}
      />
      <button className="btn primary" onClick={handleSubmit} disabled={!answer.trim() || loading}>
        {loading ? '提交中…' : '提交答案'}
      </button>
    </div>
  )
}
