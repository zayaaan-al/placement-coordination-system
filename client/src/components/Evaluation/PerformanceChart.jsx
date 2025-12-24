import React, { useMemo, useState, useCallback } from 'react'
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const seriesConfig = [
  { key: 'aptitude', label: 'Aptitude', color: '#3b82f6' },
  { key: 'logical', label: 'Logical', color: '#22c55e' },
  { key: 'machine', label: 'Machine', color: '#f97316' },
  { key: 'spring_meet', label: 'Sprint Meet', color: '#a855f7' },
  { key: 'average', label: 'Monthly average', color: '#111827' },
]

const PerformanceChart = ({ monthsFlat }) => {
  const [visible, setVisible] = useState(() => ({
    aptitude: true,
    logical: true,
    machine: true,
    spring_meet: true,
    average: true,
  }))
  const data = useMemo(() => {
    if (!monthsFlat || monthsFlat.length === 0) return []

    const sorted = [...monthsFlat].sort((a, b) => a.monthKey.localeCompare(b.monthKey))

    return sorted.map((m) => {
      const avg = m.stats?.averagePercentage ?? null
      const perType = m.stats?.perTypeAverages || {}
      return {
        monthKey: m.monthKey,
        label: m.label,
        average: avg,
        aptitude: perType.aptitude ?? 0,
        logical: perType.logical ?? 0,
        machine: perType.machine ?? 0,
        spring_meet: perType.spring_meet ?? 0,
      }
    })
  }, [monthsFlat])

  const toggleSeries = useCallback((key) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleLegendKeyDown = (event, key) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleSeries(key)
    }
  }

  if (!data.length) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white px-4 py-4 sm:px-6 sm:py-5 shadow-sm">
        <p className="text-sm text-gray-500">Chart data will appear once evaluations are recorded.</p>
      </section>
    )
  }

  return (
    <section
      className="rounded-2xl border border-gray-200 bg-white px-3 py-4 sm:px-4 sm:py-5 shadow-sm"
      aria-label="Monthly performance trend and breakdown"
    >
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Performance overview</h3>
      <p className="text-xs text-gray-500 mb-2">Monthly trend and per-test contribution (in %).</p>
      <div className="mb-2 flex flex-wrap gap-2" aria-label="Toggle performance series visibility">
        {seriesConfig.map((series) => (
          <button
            key={series.key}
            type="button"
            role="button"
            tabIndex={0}
            aria-pressed={visible[series.key]}
            onClick={() => toggleSeries(series.key)}
            onKeyDown={(e) => handleLegendKeyDown(e, series.key)}
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
              visible[series.key]
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            <span
              className="mr-1.5 h-2 w-2 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            {series.label}
          </button>
        ))}
      </div>
      <div className="h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 16, bottom: 24, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={36} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(value, name) => [`${value?.toFixed ? value.toFixed(1) : value}%`, name]}
              labelFormatter={(label) => label}
            />
            {visible.aptitude && (
              <Bar dataKey="aptitude" stackId="tests" fill="#3b82f6" name="Aptitude" isAnimationActive />
            )}
            {visible.logical && (
              <Bar dataKey="logical" stackId="tests" fill="#22c55e" name="Logical" isAnimationActive />
            )}
            {visible.machine && (
              <Bar dataKey="machine" stackId="tests" fill="#f97316" name="Machine" isAnimationActive />
            )}
            {visible.spring_meet && (
              <Bar dataKey="spring_meet" stackId="tests" fill="#a855f7" name="Sprint Meet" isAnimationActive />
            )}
            <Line
              type="monotone"
              dataKey="average"
              stroke="#111827"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 4 }}
              name="Monthly average"
              isAnimationActive
              hide={!visible.average}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export default PerformanceChart
