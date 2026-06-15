import katex from 'katex'
import 'katex/dist/katex.min.css'

const MATH_RE = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g

function renderPart(part: string, key: number) {
  if (part.startsWith('$$') && part.endsWith('$$')) {
    const html = katex.renderToString(part.slice(2, -2).trim(), {
      displayMode: true,
      throwOnError: false,
    })
    return <span key={key} className="math-block" dangerouslySetInnerHTML={{ __html: html }} />
  }
  if (part.startsWith('$') && part.endsWith('$')) {
    const html = katex.renderToString(part.slice(1, -1).trim(), {
      displayMode: false,
      throwOnError: false,
    })
    return <span key={key} className="math-inline" dangerouslySetInnerHTML={{ __html: html }} />
  }
  return <span key={key}>{part}</span>
}

export default function MathText({ text, streaming = false }: { text: string; streaming?: boolean }) {
  if (!text) return null
  if (streaming && text.includes('$') && !text.match(/\$[^$]*\$/)) {
    return <span>{text}</span>
  }
  const parts = text.split(MATH_RE)
  return <>{parts.map((part, i) => renderPart(part, i))}</>
}
