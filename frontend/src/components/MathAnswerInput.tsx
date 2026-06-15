import 'mathlive'
import 'mathlive/fonts.css'
import 'mathlive/static.css'
import { useEffect, useRef, useState } from 'react'
import type { MathfieldElement } from 'mathlive'

type Mode = 'math' | 'text'

interface Props {
  resetKey: string
  disabled?: boolean
  onChange: (value: string) => void
  onSubmit?: () => void
}

export default function MathAnswerInput({ resetKey, disabled, onChange, onSubmit }: Props) {
  const [mode, setMode] = useState<Mode>('math')
  const [textValue, setTextValue] = useState('')
  const mfRef = useRef<MathfieldElement | null>(null)

  useEffect(() => {
    setTextValue('')
    if (mfRef.current) {
      mfRef.current.setValue('')
    }
    onChange('')
  }, [resetKey])

  const syncMathValue = () => {
    const latex = mfRef.current?.getValue('latex') ?? ''
    onChange(latex)
  }

  const handleTextChange = (v: string) => {
    setTextValue(v)
    onChange(v)
  }

  const setFieldRef = (el: MathfieldElement | null) => {
    mfRef.current = el
    if (el) {
      el.mathVirtualKeyboardPolicy = 'auto'
      el.placeholder = '点击输入公式，可使用下方数学键盘'
    }
  }

  return (
    <div className={`math-answer-input ${disabled ? 'disabled' : ''}`}>
      <div className="input-mode-tabs">
        <button
          type="button"
          className={mode === 'math' ? 'active' : ''}
          onClick={() => setMode('math')}
          disabled={disabled}
        >
          公式输入
        </button>
        <button
          type="button"
          className={mode === 'text' ? 'active' : ''}
          onClick={() => setMode('text')}
          disabled={disabled}
        >
          文字输入
        </button>
      </div>

      {mode === 'math' ? (
        <div className="math-field-wrap">
          <math-field
            ref={setFieldRef}
            className="math-answer-field"
            onInput={syncMathValue}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !disabled) {
                e.preventDefault()
                onSubmit?.()
              }
            }}
          />
          <p className="answer-hint muted small">
            点击输入区打开数学键盘，支持分数、带分数、小数。比较大小请切换到「文字输入」填 <code>&lt;</code> <code>&gt;</code>
          </p>
        </div>
      ) : (
        <div className="text-field-wrap">
          <input
            className="answer-input"
            type="text"
            value={textValue}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="例：3/4、2又1/3、&lt;、&gt;、6,5"
            aria-label="文字答案"
            disabled={disabled}
            onKeyDown={(e) => e.key === 'Enter' && textValue.trim() && !disabled && onSubmit?.()}
          />
          <p className="answer-hint muted small">
            适合比较符号（<code>&lt;</code> <code>&gt;</code>）或多空格填空（如 <code>6,5</code>）
          </p>
        </div>
      )}
    </div>
  )
}
