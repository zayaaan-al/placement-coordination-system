import React from 'react'

const WeeklyTable = ({ weeklyEntries }) => {
  const rows = weeklyEntries || []

  return (
    <section className="rounded-2xl border border-gray-200 bg-white px-3 py-4 sm:px-5 sm:py-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Weekly breakdown</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No weekly evaluations recorded for this month yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-medium uppercase text-gray-500">
                <th className="py-2 pr-3">Week</th>
                <th className="py-2 px-3">Aptitude (0–25)</th>
                <th className="py-2 px-3">Logical</th>
                <th className="py-2 px-3">Machine</th>
                <th className="py-2 pl-3 text-right">Recorded</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr key={entry._id} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pr-3 text-gray-900 text-xs sm:text-sm">{entry.periodLabel}</td>
                  <td className="py-2 px-3">
                    {entry.type === 'aptitude' ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-900 border border-gray-200">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                          {entry.score}
                        </span>
                        <span className="text-gray-500">/ 25</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">–</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-700">
                    {entry.type === 'logical' ? `${entry.score}/${entry.maxScore}` : '–'}
                  </td>
                  <td className="py-2 px-3 text-xs text-gray-700">
                    {entry.type === 'machine' ? `${entry.score}/${entry.maxScore}` : '–'}
                  </td>
                  <td className="py-2 pl-3 text-right text-xs text-gray-400">
                    {entry.recordedDate ? new Date(entry.recordedDate).toLocaleDateString() : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default WeeklyTable
