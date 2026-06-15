import 'mathlive'
import 'mathlive/fonts.css'
import 'mathlive/static.css'
import { useEffect, useRef, useState } from 'react'
import type { MathfieldElement } from 'mathlive'

type Mode = 'text' | 'math'

interface Props {
  disabled?: boolean
  onSend: (text: string) => void
  onHint: () => void
}

export default function ChatInput({ disabled, onSend, onHint }: Props) {
  const [mode, setMode] = useState<Mode>('text')
  const [text, setText] = useState('')
  const [mathLatex, setMathLatex] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)
  const mfRef = useRef<MathfieldElement | null>(null)

  useEffect(() => {
    if (disabled) return
    if (mode === 'text') taRef.current?.focus()
  }, [disabled, mode])

  const setFieldRef = (el: MathfieldElement | null) => {
    mfRef.current = el
    if (el) {
      el.mathVirtualKeyboardPolicy = 'auto'
      el.placeholder = '输入公式，如分数 7/9'
    }
  }

  const send = () => {
    if (disabled) return
    if (mode === 'math') {
      const latex = (mfRef.current?.getValue('latex') ?? '').trim()
      if (!latex) return
      onSend(`$${latex}$`)
      mfRef.current?.setValue('')
      setMathLatex('')
    } else {
      const v = text.trim()
      if (!v) return
      onSend(v)
      setText('')
    }
  }

  const canSend = mode === 'math' ? !!mathLatex.trim() : !!text.trim()

  return (
    <div className="chat-input">
      <div className="input-mode-tabs">
        <button
          type="button"
          className={mode === 'text' ? 'active' : ''}
          onClick={() => setMode('text')}
          disabled={disabled}
        >
          文字
        </button>
        <button
          type="button"
          className={mode === 'math' ? 'active' : ''}
          onClick={() => setMode('math')}
          disabled={disabled}
        >
          公式
        </button>
      </div>

      <div className="chat-input-row">
        {mode === 'text' ? (
          <textarea
            ref={taRef}
            value={text}
            rows={1}
            onChange={(e) => setText(e.target.value)}
            placeholder="输入你的想法…（回车发送，Shift+回车换行）"
            aria-label="你的想法"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            disabled={disabled}
          />
        ) : (
          <math-field
            ref={setFieldRef}
            className="math-answer-field chat-math-field"
            onInput={() => setMathLatex(mfRef.current?.getValue('latex') ?? '')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !disabled) {
                e.preventDefault()
                send()
              }
            }}
          />
        )}
        <button className="btn primary" onClick={send} disabled={disabled || !canSend}>
          发送
        </button>
        <button className="btn hint-btn" onClick={onHint} disabled={disabled}>
          我需要提示
        </button>
      </div>
    </div>
  )
}
