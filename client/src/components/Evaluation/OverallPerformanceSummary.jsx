import React, { useMemo } from 'react'

const OverallPerformanceSummary = ({ overallPerformance, performance }) => {
  const summary = useMemo(() => {
    if (overallPerformance) return overallPerformance

    if (!performance?.groupedByYearMonth) return null

    const years = Object.values(performance.groupedByYearMonth).sort((a, b) => b.year - a.year)
    const monthsFlat = []
    years.forEach((yearBucket) => {
      Object.values(yearBucket.months).forEach((monthBucket) => {
        monthsFlat.push(monthBucket)
      })
    })

    const withAverage = monthsFlat.filter(
      (m) => m?.stats && m.stats.averagePercentage != null,
    )

    if (!withAverage.length) return null

    const totalAverage = withAverage.reduce(
      (sum, m) => sum + (m.stats.averagePercentage || 0),
      0,
    )
    const averagePercentage = totalAverage / withAverage.length

    const perTypeAggregate = {}
    withAverage.forEach((m) => {
      const perType = m.stats.perTypeAverages || {}
      Object.keys(perType).forEach((type) => {
        if (!perTypeAggregate[type]) {
          perTypeAggregate[type] = { total: 0, count: 0 }
        }
        perTypeAggregate[type].total += perType[type]
        perTypeAggregate[type].count += 1
      })
    })

    const perTypeAverages = Object.keys(perTypeAggregate).reduce((acc, type) => {
      const { total, count } = perTypeAggregate[type]
      acc[type] = count ? total / count : null
      return acc
    }, {})

    const sortedByAverage = [...withAverage].sort(
      (a, b) => (b.stats.averagePercentage || 0) - (a.stats.averagePercentage || 0),
    )
    const bestMonthBucket = sortedByAverage[0]
    const weakestMonthBucket = sortedByAverage[sortedByAverage.length - 1]

    let grade = null
    if (averagePercentage != null) {
      if (averagePercentage >= 80) grade = 'Excellent'
      else if (averagePercentage >= 60) grade = 'Good'
      else grade = 'Needs Improvement'
    }

    return {
      averagePercentage,
      perTypeAverages,
      bestMonth: bestMonthBucket
        ? {
            monthKey: bestMonthBucket.monthKey,
            label: bestMonthBucket.label,
            averagePercentage: bestMonthBucket.stats.averagePercentage,
          }
        : null,
      weakestMonth: weakestMonthBucket
        ? {
            monthKey: weakestMonthBucket.monthKey,
            label: weakestMonthBucket.label,
            averagePercentage: weakestMonthBucket.stats.averagePercentage,
          }
        : null,
      monthsCount: withAverage.length,
      grade,
    }
  }, [overallPerformance, performance])

  if (!summary) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white px-4 py-4 sm:px-6 sm:py-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Total performance summary</h3>
        <p className="text-xs text-gray-500">
          Once your trainer records evaluations across multiple months, an overall summary will appear here.
        </p>
      </section>
    )
  }

  const { averagePercentage, perTypeAverages, bestMonth, weakestMonth, monthsCount, grade } = summary

  return (
    <section className="rounded-2xl border border-gray-200 bg-white px-4 py-4 sm:px-6 sm:py-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Total performance</p>
          <p className="text-sm text-gray-500">Overall average across all recorded months.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Overall average</p>
          <p className="text-xl font-semibold text-gray-900">
            {averagePercentage != null ? `${averagePercentage.toFixed(1)}%` : '–'}
          </p>
          {grade && (
            <span className="mt-1 inline-flex items-center rounded-full bg-gray-900 px-2.5 py-0.5 text-[11px] font-medium text-white">
              {grade}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 text-xs sm:text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-gray-50 px-3 py-2">
          <p className="text-[11px] font-medium tracking-wide text-gray-500 uppercase mb-1">Best month</p>
          {bestMonth ? (
            <div>
              <p className="text-sm font-semibold text-gray-900">{bestMonth.label}</p>
              <p className="text-xs text-gray-600">
                {bestMonth.averagePercentage != null ? `${bestMonth.averagePercentage.toFixed(1)}%` : '–'}
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Not enough data yet.</p>
          )}
        </div>
        <div className="rounded-xl bg-gray-50 px-3 py-2">
          <p className="text-[11px] font-medium tracking-wide text-gray-500 uppercase mb-1">Weakest month</p>
          {weakestMonth ? (
            <div>
              <p className="text-sm font-semibold text-gray-900">{weakestMonth.label}</p>
              <p className="text-xs text-gray-600">
                {weakestMonth.averagePercentage != null ? `${weakestMonth.averagePercentage.toFixed(1)}%` : '–'}
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Not enough data yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-gray-50 px-3 py-2 flex items-center justify-between text-xs sm:text-sm">
        <p className="text-gray-600">Months with evaluations</p>
        <p className="font-semibold text-gray-900">{monthsCount}</p>
      </div>

      {perTypeAverages && Object.keys(perTypeAverages).length > 0 && (
        <div className="rounded-xl bg-gray-50 px-3 py-2">
          <p className="text-[11px] font-medium tracking-wide text-gray-500 uppercase mb-1">Per-test overall averages</p>
          <dl className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
            {Object.entries(perTypeAverages).map(([type, value]) => (
              <div key={type} className="flex flex-col">
                <dt className="text-gray-500 capitalize">{type.replace('_', ' ')}</dt>
                <dd className="font-semibold text-gray-900">{value != null ? `${value.toFixed(1)}%` : '–'}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  )
}

export default OverallPerformanceSummary
