import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { parseISODate } from '../lib/weights'
import type { BodyWeight } from '../lib/weights'

const LINE = '#1b6ef5'
// Neutral translucent gray reads correctly on both light and dark surfaces
// (Recharts takes literal color props, so this can't use a theme class).
const GRID = 'rgba(128,140,160,0.22)'
const AXIS_TEXT = '#9ca3af'

const shortDate = (iso: string) =>
  parseISODate(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

/** Recharts clones this element and injects `active` / `payload`. */
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: BodyWeight }[]
}) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-xl border border-gray-200 bg-surface px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-gray-500">
        {parseISODate(point.logged_on).toLocaleDateString(undefined, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })}
      </p>
      <p className="text-base font-bold text-gray-900">{point.weight_kg.toFixed(1)} kg</p>
    </div>
  )
}

export default function WeightChart({
  entries,
  goalWeight,
}: {
  entries: BodyWeight[]
  goalWeight: number | null
}) {
  const weights = entries.map((e) => e.weight_kg)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  // Keep the goal line on-screen when it's near the data, but never let a far-off
  // goal flatten the actual trend into a straight line.
  const showGoal =
    goalWeight !== null && goalWeight >= min - (max - min || 2) * 2 && goalWeight <= max + (max - min || 2) * 2
  const lo = showGoal ? Math.min(min, goalWeight) : min
  const hi = showGoal ? Math.max(max, goalWeight) : max
  const pad = Math.max(0.5, (hi - lo) * 0.15)

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={entries} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
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
            domain={[Number((lo - pad).toFixed(1)), Number((hi + pad).toFixed(1))]}
            tick={{ fontSize: 12, fill: AXIS_TEXT }}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => `${v.toFixed(0)}`}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: GRID, strokeWidth: 1 }} />
          {showGoal && (
            <ReferenceLine
              y={goalWeight}
              stroke={AXIS_TEXT}
              strokeDasharray="4 4"
              label={{
                value: `Goal ${goalWeight}`,
                position: 'insideTopRight',
                fill: AXIS_TEXT,
                fontSize: 11,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="weight_kg"
            stroke={LINE}
            strokeWidth={2}
            dot={entries.length <= 30 ? { r: 4, fill: LINE, stroke: '#fff', strokeWidth: 2 } : false}
            activeDot={{ r: 6, fill: LINE, stroke: '#fff', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
