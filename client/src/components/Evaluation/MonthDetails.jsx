import React from 'react'

const MonthDetails = ({ month, onChangeMonthKey, availableMonths }) => {
  const options = availableMonths || []

  return (
    <section className="rounded-2xl border border-gray-200 bg-white px-4 py-4 sm:px-6 sm:py-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Month</p>
          <p className="text-sm font-semibold text-gray-900">{month?.label || 'No data'}</p>
        </div>
        <select
          className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          value={month?.monthKey || ''}
          onChange={(e) => onChangeMonthKey(e.target.value)}
          aria-label="Select month"
        >
          {options.map((opt) => (
            <option key={opt.monthKey} value={opt.monthKey}>{opt.label}</option>
          ))}
        </select>
      </div>
      {month && month.springMeet && (
        <div className="rounded-xl bg-primary-50 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-wide text-primary-700 uppercase">Spring Meet</p>
            <p className="text-sm font-semibold text-primary-900">
              {month.springMeet.score}/{month.springMeet.maxScore} ({month.springMeet.percentage?.toFixed(1)}%)
            </p>
            <p className="text-xs text-primary-700 mt-0.5">{month.springMeet.periodLabel}</p>
          </div>
        </div>
      )}
    </section>
  )
}

export default MonthDetails
