import type { RootCause } from '../api/client'

export default function RootCauseChain({ causes }: { causes: RootCause[] }) {
  if (!causes.length) return null
  return (
    <div className="root-causes">
      <h3>🔍 诊断结果：知识漏洞追溯</h3>
      {causes.map((c) => (
        <div key={c.skill_id} className="root-cause-card">
          <div className="root-cause-title">
            {c.skill_name} — 掌握度 {Math.round(c.p_known * 100)}%
          </div>
          <div className="root-cause-chain">
            {c.chain.map((name, i) => (
              <span key={i}>
                {i > 0 && <span className="arrow"> ← </span>}
                {name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
