import React, { useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const WeekTrendChart = ({ weeklyEntries }) => {
  const data = useMemo(() => {
    if (!weeklyEntries || weeklyEntries.length === 0) return []

    // Group by week label and compute average percentage across types
    const byWeek = weeklyEntries.reduce((acc, entry) => {
      const key = entry.periodLabel || 'Week'
      const percentage = entry.maxScore ? (entry.score / entry.maxScore) * 100 : null
      if (percentage == null) return acc
      if (!acc[key]) acc[key] = { label: key, total: 0, count: 0 }
      acc[key].total += percentage
      acc[key].count += 1
      return acc
    }, {})

    return Object.values(byWeek).map((w) => ({
      label: w.label,
      average: w.count ? w.total / w.count : null,
    }))
  }, [weeklyEntries])

  if (!data.length) {
    return null
  }

  return (
    <section
      className="rounded-2xl border border-gray-200 bg-white px-3 py-3 sm:px-4 sm:py-4 shadow-sm mb-1"
      aria-label="Weekly performance trend for selected month"
    >
      <h3 className="text-sm font-semibold text-gray-900 mb-1">Weekly trend</h3>
      <p className="text-xs text-gray-500 mb-2">Average weekly percentage across all tests.</p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} hide />
            <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(value) => [`${value?.toFixed ? value.toFixed(1) : value}%`, 'Average']}
              labelFormatter={(label) => label}
            />
            <Line
              type="monotone"
              dataKey="average"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 3 }}
              isAnimationActive
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export default WeekTrendChart
