import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { trainersAPI, handleAPIError } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import {
  UserGroupIcon,
  ChartBarIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts'

const TrainerAnalytics = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
  const [students, setStudents] = useState([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [threshold, setThreshold] = useState(60)

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        if (!user?._id) return
        setStudentsLoading(true)
        const res = await trainersAPI.getTrainerStudents(user._id, { limit: 500 })
        if (res.data.success) {
          setStudents(res.data.data.students || [])
        }
      } catch (error) {
        handleAPIError(error, 'Failed to load students')
      } finally {
        setStudentsLoading(false)
      }
    }

    fetchStudents()
  }, [user])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const params = {
        threshold,
      }
      if (selectedBatch) params.batch = selectedBatch
      if (selectedStudent) params.studentProfileId = selectedStudent
      if (selectedMonth) params.month = selectedMonth

      const res = await trainersAPI.getStudentAnalytics(params)
      if (res.data.success) {
        setAnalytics(res.data.data)
      }
    } catch (error) {
      handleAPIError(error, 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatch, selectedStudent, selectedMonth, threshold])

  const batchOptions = useMemo(() => {
    const batches = Array.from(new Set(students.map((s) => s.batch).filter(Boolean)))
    return batches.sort()
  }, [students])

  const monthOptions = useMemo(() => {
    if (!analytics?.monthlyTrend) return []
    return analytics.monthlyTrend.map((m) => m.month)
  }, [analytics])

  const monthlyTrendData = useMemo(() => {
    if (!analytics?.monthlyTrend) return []
    return analytics.monthlyTrend.map((m) => ({
      month: m.month,
      avgScore: m.avgScore,
      evaluations: m.evaluations,
    }))
  }, [analytics])

  const typeBreakdownData = useMemo(() => {
    if (!analytics?.typeBreakdown) return []
    return analytics.typeBreakdown.map((t) => ({
      type: t.type.replace('_', ' '),
      avgScore: t.avgScore,
      evaluations: t.evaluations,
    }))
  }, [analytics])

  const perStudentSorted = useMemo(() => {
    if (!analytics?.perStudent) return []
    return [...analytics.perStudent].sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0))
  }, [analytics])

  const summary = analytics?.summary || {}
  const insights = analytics?.insights || {}

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Analytics</h1>
          <p className="text-gray-600 text-sm">
            Aggregated insights across your evaluated students. Filters are based on your assigned students and
            their recorded evaluations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <button
            type="button"
            onClick={loadAnalytics}
            className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <ChartBarIcon className="h-4 w-4 mr-1.5 text-primary-600" />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap gap-3 items-end justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 mb-1">Batch</label>
              <select
                className="rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                disabled={studentsLoading}
              >
                <option value="">All batches</option>
                {batchOptions.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 mb-1">Student</label>
              <select
                className="rounded-md border-gray-300 text-sm shadow-sm min-w-[10rem] focus:border-primary-500 focus:ring-primary-500"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                disabled={studentsLoading}
              >
                <option value="">All students</option>
                {students
                  .filter((s) => !selectedBatch || s.batch === selectedBatch)
                  .map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.userId?.name?.first} {s.userId?.name?.last} ({s.rollNo})
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-medium text-gray-600 mb-1">Month</label>
              <select
                className="rounded-md border-gray-300 text-sm shadow-sm min-w-[8rem] focus:border-primary-500 focus:ring-primary-500"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                disabled={!monthOptions.length}
              >
                <option value="">All months</option>
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600 mb-1">Alert threshold (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value) || 0)}
              className="w-24 rounded-md border-gray-300 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Students</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.totalStudents || 0}</p>
            <p className="text-xs text-gray-500">Assigned and approved under you</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center">
            <UserGroupIcon className="h-6 w-6 text-primary-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Average performance</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.avgScore || 0}%</p>
          <p className="text-xs text-gray-500">Across all selected evaluations</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Evaluations</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{summary.totalEvaluations || 0}</p>
          <p className="text-xs text-gray-500">Total evaluations in current view</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Monthly trend</h2>
            <p className="text-xs text-gray-500">Average score and evaluation volume over time</p>
          </div>
          {monthlyTrendData.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData} margin={{ top: 10, right: 16, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11 }}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip
                    formatter={(value, name) =>
                      name === 'Average score' ? [`${value}%`, name] : [value, name]
                    }
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="avgScore"
                    name="Average score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 4 }}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="evaluations"
                    name="Evaluations"
                    fill="#c4b5fd"
                    barSize={18}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-56 text-gray-500 text-sm">
              <ChartBarIcon className="h-10 w-10 mb-2 text-gray-300" />
              <p>No evaluation data available for the selected filters.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Insights</h2>
          {insights.mostImproved ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 flex items-start gap-2">
              <ArrowUpRightIcon className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-emerald-800">Most improved student</p>
                <p className="text-sm font-medium text-gray-900">
                  {insights.mostImproved.name} ({insights.mostImproved.rollNo})
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Trend: {insights.mostImproved.trend > 0 ? '+' : ''}
                  {insights.mostImproved.trend?.toFixed(1)}%
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 flex items-start gap-2">
              <ArrowUpRightIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-800">Most improved student</p>
                <p className="text-xs text-gray-500">Not enough month-wise data yet.</p>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-800">
                  Students below {threshold}% average
                </p>
                {insights.studentsBelowThreshold &&
                insights.studentsBelowThreshold.length > 0 ? (
                  <ul className="mt-1 space-y-1 max-h-40 overflow-y-auto pr-1">
                    {insights.studentsBelowThreshold.slice(0, 6).map((s) => (
                      <li key={s.studentProfileId} className="text-xs text-amber-900 flex justify-between gap-2">
                        <span>
                          {s.name} ({s.rollNo})
                        </span>
                        <span className="font-semibold">{s.avgScore ?? s.aggregateScore}%</span>
                      </li>
                    ))}
                    {insights.studentsBelowThreshold.length > 6 && (
                      <li className="text-[11px] text-amber-700 mt-1">
                        + {insights.studentsBelowThreshold.length - 6} more
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-amber-700">
                    No students are currently below the configured threshold.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <p className="text-xs font-semibold text-gray-800 mb-1">Quick tip</p>
            <p className="text-xs text-gray-600">
              Use batch and month filters together to focus on specific cohorts and periods, then open the
              evaluation page to update scores.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Sprint meet vs tests</h2>
            <p className="text-xs text-gray-500">Average scores by category</p>
          </div>
          {typeBreakdownData.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeBreakdownData} margin={{ top: 10, right: 16, bottom: 24, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(value, name) =>
                      name === 'Average score' ? [`${value}%`, name] : [value, name]
                    }
                  />
                  <Legend />
                  <Bar dataKey="avgScore" name="Average score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="evaluations" name="Evaluations" fill="#a5b4fc" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-56 text-gray-500 text-sm">
              <ChartBarIcon className="h-10 w-10 mb-2 text-gray-300" />
              <p>No category-wise data available yet.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Per-student overview</h2>
            <p className="text-xs text-gray-500">Sorted by average score</p>
          </div>
          {perStudentSorted.length ? (
            <div className="max-h-72 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                      Batch
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">
                      Avg
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">
                      Latest
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {perStudentSorted.map((s) => {
                    const trendPositive = (s.trend || 0) > 0
                    const trendNegative = (s.trend || 0) < 0
                    return (
                      <tr key={s.studentProfileId} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-gray-900">
                          <div className="flex flex-col">
                            <span className="font-medium">{s.name}</span>
                            <span className="text-[11px] text-gray-500">{s.rollNo}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-700">{s.batch}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-right font-semibold text-gray-900">
                          {s.avgScore != null ? `${s.avgScore}%` : '–'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right text-gray-700">
                          {s.latestScore != null ? `${s.latestScore}%` : '–'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right">
                          {s.trend == null ? (
                            <span className="text-[11px] text-gray-400">–</span>
                          ) : (
                            <span
                              className={`inline-flex items-center text-[11px] font-medium ${
                                trendPositive
                                  ? 'text-emerald-600'
                                  : trendNegative
                                  ? 'text-rose-600'
                                  : 'text-gray-500'
                              }`}
                            >
                              {trendPositive && <ArrowUpRightIcon className="h-3 w-3 mr-0.5" />}
                              {trendNegative && <ArrowDownRightIcon className="h-3 w-3 mr-0.5" />}
                              {s.trend > 0 ? '+' : ''}
                              {s.trend?.toFixed(1)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-56 text-gray-500 text-sm">
              <UserGroupIcon className="h-10 w-10 mb-2 text-gray-300" />
              <p>No student evaluations found for the selected filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrainerAnalytics
