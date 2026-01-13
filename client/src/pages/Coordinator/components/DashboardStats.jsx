import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FiAlertCircle } from 'react-icons/fi'
import { FaUserGraduate, FaChalkboardTeacher, FaBriefcase, FaClipboardCheck } from 'react-icons/fa';

const useCountUp = (target, enabled) => {
  const [value, setValue] = React.useState(0)

  React.useEffect(() => {
    if (!enabled) {
      setValue(typeof target === 'number' ? target : 0)
      return
    }

    if (typeof target !== 'number') {
      setValue(0)
      return
    }

    const durationMs = 700
    const start = performance.now()
    const startValue = 0

    let rafId = 0
    const tick = (now) => {
      const elapsed = now - start
      const t = Math.min(1, elapsed / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(startValue + (target - startValue) * eased))
      if (t < 1) rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [target, enabled])

  return value
}

export default function DashboardStats({ stats, loading, error }) {
  const navigate = useNavigate()
  const percentChange = typeof stats?.totalStudentsPercentChange === 'number'
    ? Math.round(stats.totalStudentsPercentChange)
    : null

  const hasError = !!error && !loading

  const totalStudents = useCountUp(stats?.totalStudents, !loading && !hasError)
  const activeTrainers = useCountUp(stats?.activeTrainers, !loading && !hasError)
  const openPositions = useCountUp(stats?.openPositions, !loading && !hasError)
  const pendingApprovals = useCountUp(stats?.pendingApprovals, !loading && !hasError)

  const statCards = [
    {
      title: 'Total Students',
      value: typeof stats?.totalStudents === 'number' ? String(totalStudents) : '—',
      icon: <FaUserGraduate className="text-3xl" />,
      color: 'bg-blue-100 text-blue-600',
      trend: percentChange == null ? '—' : `${percentChange >= 0 ? '+' : ''}${percentChange}% from last month`,
      href: null,
    },
    {
      title: 'Active Trainers',
      value: typeof stats?.activeTrainers === 'number' ? String(activeTrainers) : '—',
      icon: <FaChalkboardTeacher className="text-3xl" />,
      color: 'bg-green-100 text-green-600',
      trend: typeof stats?.newTrainersThisMonth === 'number' ? `+${stats.newTrainersThisMonth} this month` : '—',
      href: '/dashboard/trainers',
    },
    {
      title: 'Open Positions',
      value: typeof stats?.openPositions === 'number' ? String(openPositions) : '—',
      icon: <FaBriefcase className="text-3xl" />,
      color: 'bg-purple-100 text-purple-600',
      trend: typeof stats?.newJobsToday === 'number' ? `${stats.newJobsToday} new today` : '—',
      href: null,
    },
    {
      title: 'Pending Approvals',
      value: typeof stats?.pendingApprovals === 'number' ? String(pendingApprovals) : '—',
      icon: <FaClipboardCheck className="text-3xl" />,
      color: 'bg-amber-100 text-amber-600',
      trend: typeof stats?.pendingApprovals === 'number'
        ? stats.pendingApprovals > 0
          ? 'Needs attention'
          : 'All caught up'
        : '—',
      href: null,
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {(loading ? Array.from({ length: 4 }) : statCards).map((stat, index) => (
        (() => {
          const isClickable = !!stat?.href && !loading && !hasError
          return (
        <div
          key={index}
          className={`bg-white rounded-xl shadow-sm p-6 transition-shadow ${isClickable ? 'cursor-pointer hover:shadow-md hover:scale-[1.01] transition-transform' : 'hover:shadow-md'}`}
          role={isClickable ? 'button' : undefined}
          tabIndex={isClickable ? 0 : undefined}
          onClick={isClickable ? () => navigate(stat.href) : undefined}
          onKeyDown={isClickable ? (e) => { if (e.key === 'Enter') navigate(stat.href) } : undefined}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{loading ? '—' : stat.title}</p>
              <p className="text-2xl font-semibold mt-1">
                {loading ? <span className="inline-block h-7 w-16 bg-gray-200 rounded animate-pulse" /> : stat.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {loading ? (
                  <span className="inline-block h-4 w-28 bg-gray-200 rounded animate-pulse" />
                ) : hasError ? (
                  <span className="inline-flex items-center gap-1">
                    <FiAlertCircle className="text-amber-500" />
                    <span>Unable to load stats</span>
                  </span>
                ) : (
                  stat.trend
                )}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${loading ? 'bg-gray-100 text-gray-400' : stat.color}`}>
              {loading ? <FaClipboardCheck className="text-3xl" /> : stat.icon}
            </div>
          </div>
        </div>
          )
        })()
      ))}
    </div>
  );
}
