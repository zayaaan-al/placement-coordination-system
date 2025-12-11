import React from 'react'
import { ArrowUpRight, ArrowDownRight, Minus, CircleCheck } from 'lucide-react'

const PerformanceHero = ({ hero, trend }) => {
  if (!hero) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white px-4 py-5 sm:px-6 sm:py-6 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Performance</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">No evaluations yet</p>
          <p className="mt-1 text-sm text-gray-500">Your trainer hasn't recorded any evaluations for you yet.</p>
        </div>
      </section>
    )
  }

  let TrendIcon = Minus
  let trendColor = 'text-gray-600 bg-gray-100'
  if (trend?.direction === 'up') {
    TrendIcon = ArrowUpRight
    trendColor = 'text-success-600 bg-success-50'
  } else if (trend?.direction === 'down') {
    TrendIcon = ArrowDownRight
    trendColor = 'text-danger-600 bg-danger-50'
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white px-4 py-5 sm:px-6 sm:py-6 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Current month</p>
        <div className="mt-1 flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{hero.period.label}</h2>
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${hero.status === 'COMPLETED' ? 'bg-success-100 text-success-800' : 'bg-warning-100 text-warning-800'}`}>
            <CircleCheck className="mr-1 h-3 w-3" />
            {hero.status === 'COMPLETED' ? 'Month Completed' : 'In Progress'}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">Average across all evaluations this month.</p>
        <p className="mt-3 text-3xl font-semibold text-gray-900">
          {hero.averagePercentage != null ? `${hero.averagePercentage.toFixed(1)}%` : '–'}
        </p>
        {hero.lastUpdated && (
          <p className="mt-1 text-xs text-gray-400">Last updated {new Date(hero.lastUpdated).toLocaleString()}</p>
        )}
      </div>
      <div className="flex flex-row gap-4 sm:flex-col sm:items-end">
        <div className="rounded-xl bg-gray-50 px-4 py-3 w-full sm:w-56">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Per-test averages</p>
          <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
            {Object.entries(hero.perTypeAverages || {}).map(([type, value]) => (
              <div key={type} className="flex flex-col">
                <dt className="text-gray-500 capitalize">{type.replace('_', ' ')}</dt>
                <dd className="font-semibold text-gray-900">{value != null ? `${value.toFixed(1)}%` : '–'}</dd>
              </div>
            ))}
          </dl>
        </div>
        {trend && (
          <div
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${trendColor}`}
            aria-label={trend.label}
          >
            <TrendIcon className="h-4 w-4" />
            <span>{trend.label}</span>
          </div>
        )}
      </div>
    </section>
  )
}

export default PerformanceHero
