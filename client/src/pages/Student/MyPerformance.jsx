import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { studentsAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import PerformanceHero from '../../components/Evaluation/PerformanceHero'
import MonthDetails from '../../components/Evaluation/MonthDetails'
import WeeklyTable from '../../components/Evaluation/WeeklyTable'
import InsightsPanel from '../../components/Evaluation/InsightsPanel'
import PerformanceChart from '../../components/Evaluation/PerformanceChart'
import WeekTrendChart from '../../components/Evaluation/WeekTrendChart'
import OverallPerformanceSummary from '../../components/Evaluation/OverallPerformanceSummary'

const POLL_INTERVAL_MS = 20000

const MyPerformance = () => {
  const { user } = useAuth()
  const [performance, setPerformance] = useState(null)
  const [hero, setHero] = useState(null)
  const [selectedMonthKey, setSelectedMonthKey] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadPerformance = async (showError) => {
    try {
      const [perfRes, heroRes] = await Promise.all([
        studentsAPI.getMyPerformance(),
        studentsAPI.getMyPerformanceLatest(),
      ])

      if (perfRes.data.success) {
        setPerformance(perfRes.data.data)
      } else if (showError) {
        toast.error(perfRes.data.error || 'Failed to load performance')
      }

      if (heroRes.data.success) {
        setHero(heroRes.data.data)
        if (heroRes.data.data?.lastUpdated) {
          setLastUpdated(heroRes.data.data.lastUpdated)
        }
      }
    } catch (error) {
      if (showError) {
        toast.error('Failed to load performance')
      }
    }
  }

  useEffect(() => {
    loadPerformance(true)
  }, [])

  useEffect(() => {
    let interval
    const startPolling = async () => {
      interval = setInterval(async () => {
        try {
          const params = lastUpdated ? { since: lastUpdated } : undefined
          const res = await studentsAPI.getMyPerformanceAlerts(params)
          if (res.data.success && res.data.data.hasUpdates) {
            toast.success('Your trainer has updated your evaluations')
            await loadPerformance(false)
          }
          if (res.data.success && res.data.data.lastUpdated) {
            setLastUpdated(res.data.data.lastUpdated)
          }
        } catch (e) {
        }
      }, POLL_INTERVAL_MS)
    }

    startPolling()

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [lastUpdated])

  const { currentMonth, availableMonths, weeklyEntriesForSelected } = useMemo(() => {
    if (!performance?.groupedByYearMonth) {
      return { currentMonth: null, availableMonths: [], weeklyEntriesForSelected: [] }
    }

    const years = Object.values(performance.groupedByYearMonth).sort((a, b) => b.year - a.year)
    const monthsFlat = []
    years.forEach((yearBucket) => {
      Object.values(yearBucket.months).forEach((monthBucket) => {
        monthsFlat.push(monthBucket)
      })
    })

    monthsFlat.sort((a, b) => b.monthKey.localeCompare(a.monthKey))

    const selected = selectedMonthKey
      ? monthsFlat.find((m) => m.monthKey === selectedMonthKey) || monthsFlat[0]
      : monthsFlat[0]

    const weeklyEntriesForSelected = selected ? selected.weeklyEntries : []

    return {
      currentMonth: selected || null,
      availableMonths: monthsFlat,
      weeklyEntriesForSelected,
    }
  }, [performance, selectedMonthKey])

  const trendForHero = useMemo(() => {
    if (!performance?.groupedByYearMonth) return null

    const years = Object.values(performance.groupedByYearMonth).sort((a, b) => b.year - a.year)
    const monthsFlat = []
    years.forEach((yearBucket) => {
      Object.values(yearBucket.months).forEach((monthBucket) => {
        monthsFlat.push(monthBucket)
      })
    })
    monthsFlat.sort((a, b) => b.monthKey.localeCompare(a.monthKey))

    if (monthsFlat.length < 2) return null

    const latest = monthsFlat[0]
    const prev = monthsFlat[1]
    const latestAvg = latest.stats?.averagePercentage
    const prevAvg = prev.stats?.averagePercentage

    if (latestAvg == null || prevAvg == null) return null

    const delta = latestAvg - prevAvg
    let direction = 'flat'
    if (delta > 0.1) direction = 'up'
    else if (delta < -0.1) direction = 'down'

    return {
      direction,
      delta,
      label: `Performance ${direction === 'up' ? 'up' : direction === 'down' ? 'down' : 'flat'} ${Math.abs(delta).toFixed(1)}% vs ${prev.label}`,
    }
  }, [performance])

  const handleChangeMonthKey = (key) => {
    setSelectedMonthKey(key)
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">My Performance</h1>
        <p className="text-sm text-gray-600">View your latest evaluations, weekly scores, and monthly summary.</p>
      </header>

      <PerformanceHero hero={hero} trend={trendForHero} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-4 lg:col-span-2">
          <MonthDetails
            month={currentMonth}
            onChangeMonthKey={handleChangeMonthKey}
            availableMonths={availableMonths}
          />
          <WeeklyTable weeklyEntries={weeklyEntriesForSelected} />
        </div>
        <div className="space-y-4 lg:col-span-1">
          {/* Week-level chart on small screens (above monthly chart) */}
          <div className="block md:hidden">
            <WeekTrendChart weeklyEntries={weeklyEntriesForSelected} />
          </div>
          <PerformanceChart monthsFlat={availableMonths} />
          {/* Desktop week-level chart inline below monthly chart */}
          <div className="hidden md:block">
            <WeekTrendChart weeklyEntries={weeklyEntriesForSelected} />
          </div>
          <OverallPerformanceSummary
            overallPerformance={performance?.overallPerformance}
            performance={performance}
          />
          <InsightsPanel hero={hero} performance={performance} />
        </div>
      </div>
    </div>
  )
}

export default MyPerformance
