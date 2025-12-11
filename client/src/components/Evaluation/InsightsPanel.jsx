import React, { useMemo } from 'react'
import { Lightbulb } from 'lucide-react'

const InsightsPanel = ({ hero, performance }) => {
  const tips = useMemo(() => {
    const results = []

    if (!performance?.groupedByYearMonth) {
      results.push('Once your trainer records evaluations, you will see personalised insights here.')
      return results
    }

    const years = Object.values(performance.groupedByYearMonth).sort((a, b) => b.year - a.year)
    const monthsFlat = []
    years.forEach((yearBucket) => {
      Object.values(yearBucket.months).forEach((monthBucket) => {
        monthsFlat.push(monthBucket)
      })
    })
    monthsFlat.sort((a, b) => b.monthKey.localeCompare(a.monthKey))

    const latest = monthsFlat[0]
    const prev = monthsFlat[1]

    if (latest?.stats?.perTypeAverages) {
      const perType = latest.stats.perTypeAverages
      const entries = Object.entries(perType)
      if (entries.length) {
        // Weakest area insight
        const [weakType, weakValue] = entries.reduce((min, curr) => (curr[1] < min[1] ? curr : min))
        results.push(
          `${weakType.replace('_', ' ')} seems to be your weakest area this month at ${weakValue.toFixed(
            1
          )}%. Consider revising core concepts and practising targeted questions.`,
        )
        // Strongest area insight
        const [strongType, strongValue] = entries.reduce((max, curr) => (curr[1] > max[1] ? curr : max))
        results.push(
          `Your strongest area is ${strongType.replace('_', ' ')} at ${strongValue.toFixed(
            1
          )}%. Keep up the consistency and aim to maintain this level next month.`,
        )
      }
    }

    // Improvement vs previous month
    if (latest && prev && latest.stats?.averagePercentage != null && prev.stats?.averagePercentage != null) {
      const delta = latest.stats.averagePercentage - prev.stats.averagePercentage
      if (Math.abs(delta) >= 0.5) {
        const direction = delta > 0 ? 'improved' : 'dropped'
        results.push(
          `Your overall performance has ${direction} by ${Math.abs(delta).toFixed(1)}% compared to ${
            prev.label
          }. Try to reflect on what contributed to this change.`,
        )
      }
    }

    if (!results.length) {
      results.push('You are maintaining a steady performance. Focus on consistent weekly practice to improve further.')
    }

    return results
  }, [hero, performance])

  return (
    <section className="rounded-2xl border border-gray-200 bg-white px-4 py-4 sm:px-6 sm:py-5 shadow-sm space-y-3" aria-label="Performance insights">
      <div className="flex items-center gap-2">
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Insights</p>
          <p className="text-xs text-gray-500">Short tips based on your recent performance.</p>
        </div>
      </div>
      <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
        {tips.map((tip, index) => (
          <li key={index}>{tip}</li>
        ))}
      </ul>
    </section>
  )
}

export default InsightsPanel
