import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { parseISODate } from '../lib/weights'
import type { ProgressPoint } from '../lib/progress'

const LINE = '#1b6ef5'
const GRID = 'rgba(128,140,160,0.22)'
const AXIS_TEXT = '#9ca3af'

const shortDate = (iso: string) =>
  parseISODate(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

function ChartTooltip({
  active,
  payload,
  metric,
  unit,
}: {
  active?: boolean
  payload?: { payload: ProgressPoint }[]
  metric?: 'weight_kg' | 'volume'
  unit?: string
}) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  const value = metric === 'volume' ? p.volume : p.weight_kg
  return (
    <div className="rounded-xl border border-gray-200 bg-surface px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-gray-500">
        {parseISODate(p.logged_on).toLocaleDateString(undefined, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })}
      </p>
      <p className="text-base font-bold text-gray-900">
        {metric === 'volume' ? Math.round(value).toLocaleString() : value.toFixed(1)} {unit}
      </p>
      <p className="text-xs text-gray-400">
        {p.weight_kg} kg × {p.reps} × {p.sets}
      </p>
    </div>
  )
}

export default function ProgressChart({
  points,
  metric,
}: {
  points: ProgressPoint[]
  metric: 'weight_kg' | 'volume'
}) {
  const unit = 'kg'
  const values = points.map((p) => (metric === 'volume' ? p.volume : p.weight_kg))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = Math.max(metric === 'volume' ? 20 : 1, (max - min) * 0.15)

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 4, left: -4 }}>
          <CartesianGrid stroke={GRID} strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="logged_on"
            tickFormatter={shortDate}
            tick={{ fontSize: 12, fill: AXIS_TEXT }}
            tickLine={false}
            axisLine={{ stroke: GRID }}
            minTickGap={28}
          />
          <YAxis
            domain={[Math.max(0, Number((min - pad).toFixed(0))), Number((max + pad).toFixed(0))]}
            tick={{ fontSize: 12, fill: AXIS_TEXT }}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => (metric === 'volume' ? `${Math.round(v / 100) / 10}k` : `${v}`)}
          />
          <Tooltip
            content={<ChartTooltip metric={metric} unit={unit} />}
            cursor={{ stroke: GRID, strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey={metric}
            stroke={LINE}
            strokeWidth={2}
            dot={points.length <= 30 ? { r: 4, fill: LINE, stroke: '#fff', strokeWidth: 2 } : false}
            activeDot={{ r: 6, fill: LINE, stroke: '#fff', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
