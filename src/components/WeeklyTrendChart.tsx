import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { parseISODate } from '../lib/weights'
import type { WeekPoint } from '../lib/logs'

// One series with the current week emphasized — a light tint of the same brand hue
// for past weeks, full brand for this week. Emphasis, not a second category, so no
// legend is needed; the caption names the highlight.
const CURRENT = '#1b6ef5'
const PAST = '#c4d9fc'
const AXIS_TEXT = '#9ca3af'

function TrendTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean
  payload?: { payload: WeekPoint }[]
  unit?: string
}) {
  if (!active || !payload?.length) return null
  const w = payload[0].payload
  const weekEnd = new Date(parseISODate(w.weekStart).getTime() + 6 * 86400000)
  return (
    <div className="rounded-xl border border-gray-200 bg-surface px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-gray-500">
        {w.label} – {weekEnd.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
      </p>
      <p className="text-base font-bold text-gray-900">
        {Math.round(w.value).toLocaleString()} {unit}
      </p>
    </div>
  )
}

export default function WeeklyTrendChart({ data, unit }: { data: WeekPoint[]; unit: string }) {
  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="22%">
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: AXIS_TEXT }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <Tooltip content={<TrendTooltip unit={unit} />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.weekStart} fill={d.isCurrent ? CURRENT : PAST} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
