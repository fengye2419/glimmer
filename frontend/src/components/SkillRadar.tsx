import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import type { MasteryItem } from '../api/client'

export default function SkillRadar({ data }: { data: MasteryItem[] }) {
  const chartData = data.slice(0, 10).map((d) => ({
    skill: d.skill_name.length > 5 ? d.skill_name.slice(0, 5) + '…' : d.skill_name,
    fullName: d.skill_name,
    mastery: Math.round(d.p_known * 100),
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={chartData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} />
        <Radar name="掌握度" dataKey="mastery" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.5} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
