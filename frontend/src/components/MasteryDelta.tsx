import type { MasteryItem } from '../api/client'

export default function MasteryDelta({ skills }: { skills: MasteryItem[] }) {
  if (!skills?.length) return null
  return (
    <div className="mastery-delta">
      {skills.map((s) => (
        <span key={s.skill_id} className="mastery-tag">
          {s.skill_name} {Math.round(s.p_known * 100)}%
        </span>
      ))}
    </div>
  )
}
