import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TrendPoint } from '../api/client'

export default function MasteryTrend({ data }: { data: TrendPoint[] }) {
  const chartData = data.map((d) => ({
    date: d.date.slice(5),
    mastery: Math.round(d.avg_mastery * 100),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} />
        <Tooltip formatter={(v) => [`${v ?? 0}%`, '平均掌握度']} />
        <Line type="monotone" dataKey="mastery" stroke="#10b981" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
