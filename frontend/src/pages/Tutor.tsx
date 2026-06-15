import { useEffect, useState, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  createTutorSession,
  tutorChatStream,
  getHealth,
  STUDENT_KEY,
  apiErrorMessage,
  type TutorSession,
} from '../api/client'
import MathText from '../components/MathText'
import ChatInput from '../components/ChatInput'
import ErrorState from '../components/ErrorState'

export default function TutorPage() {
  const { questionId } = useParams()
  const [session, setSession] = useState<TutorSession | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [streamText, setStreamText] = useState('')
  const [error, setError] = useState('')
  const [ollamaOk, setOllamaOk] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const nav = useNavigate()
  const studentId = localStorage.getItem(STUDENT_KEY)!

  useEffect(() => {
    if (!studentId || !questionId) {
      nav('/')
      return
    }
    setError('')
    createTutorSession(studentId, questionId)
      .then((r) => setSession(r.data))
      .catch((e) => setError(apiErrorMessage(e, '创建讲题会话失败')))
    getHealth().then((r) => setOllamaOk(r.data.ollama_healthy)).catch(() => setOllamaOk(false))
  }, [studentId, questionId, nav])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages, streamText])

  const send = (msg: string) => {
    if (!session || streaming) return
    setStreaming(true)
    setStreamText('')
    const userMsg = msg || '我需要一点提示'
    setSession((s) =>
      s ? { ...s, messages: [...s.messages, { role: 'user', content: userMsg }] } : s,
    )

    let accumulated = ''
    tutorChatStream(
      studentId,
      session.id,
      userMsg,
      (chunk) => {
        accumulated += chunk
        setStreamText(accumulated)
      },
      () => {
        setStreaming(false)
        const content =
          accumulated ||
          '⚠️ AI 未返回内容。请确认 Ollama 已启动并加载模型（如 qwen3.5:2b）。'
        setSession((s) =>
          s
            ? { ...s, messages: [...s.messages, { role: 'assistant', content }] }
            : s,
        )
        setStreamText('')
      },
      (errMsg) => {
        setStreaming(false)
        setSession((s) =>
          s
            ? {
                ...s,
                messages: [...s.messages, { role: 'assistant', content: `⚠️ ${errMsg}` }],
              }
            : s,
        )
        setStreamText('')
      },
    )
  }

  if (error) {
    return (
      <div className="page">
        <ErrorState message={error} onRetry={() => nav(-1)} />
      </div>
    )
  }

  if (!session) return <div className="loading">准备讲题会话…</div>

  return (
    <div className="page tutor-page">
      <header className="page-header">
        <div>
          <div className="breadcrumb">
            <Link to="/practice">练习</Link>
            <span> › </span>
            <span>AI 讲题</span>
          </div>
          <h1>AI 引导讲题</h1>
          <p className="muted">苏格拉底式提问 · 不直接给答案</p>
        </div>
        <div className="status-badge">
          {ollamaOk ? '🟢 AI 在线' : '🟡 模板提示'}
        </div>
      </header>

      {session.question_stem && (
        <section className="card question-context">
          <h3>当前题目</h3>
          <MathText text={session.question_stem} />
        </section>
      )}

      <div className="chat-box">
        {session.messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <MathText text={m.content} />
          </div>
        ))}
        {streaming && streamText && (
          <div className="bubble assistant streaming">
            <MathText text={streamText} streaming />
          </div>
        )}
        {streaming && !streamText && (
          <div className="bubble assistant thinking">思考中…</div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput disabled={streaming} onSend={(t) => send(t)} onHint={() => send('')} />
      <div className="btn-row">
        <Link to="/practice" className="btn ghost">返回练习</Link>
        <Link to="/dashboard" className="btn ghost">回仪表盘</Link>
      </div>
      <p className="muted small">本页面不提供「查看答案」，请通过思考得出结果</p>
    </div>
  )
}
