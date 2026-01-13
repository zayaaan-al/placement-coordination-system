import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usersAPI, jobsAPI, notificationsAPI, studentsAPI } from '../../services/api'
import {
  AcademicCapIcon,
  BriefcaseIcon,
  ChartBarIcon,
  TrophyIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

const StudentDashboard = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [performance, setPerformance] = useState(null)
  const [performanceLastUpdated, setPerformanceLastUpdated] = useState(null)
  const [jobMatches, setJobMatches] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  // Process performance data for monthly trend chart
  const monthlyTrendData = useMemo(() => {
    if (!performance?.groupedByYearMonth) return []

    const years = Object.values(performance.groupedByYearMonth).sort((a, b) => b.year - a.year)
    const monthsFlat = []
    
    years.forEach((yearBucket) => {
      Object.values(yearBucket.months).forEach((monthBucket) => {
        if (monthBucket.stats?.averagePercentage != null) {
          monthsFlat.push({
            month: monthBucket.label,
            monthKey: monthBucket.monthKey,
            average: monthBucket.stats.averagePercentage,
            year: yearBucket.year
          })
        }
      })
    })

    // Sort by date (oldest first for chart)
    return monthsFlat.sort((a, b) => a.monthKey.localeCompare(b.monthKey))
  }, [performance])

  // Calculate month-over-month trend insight
  const trendInsight = useMemo(() => {
    if (monthlyTrendData.length < 2) return null

    const latest = monthlyTrendData[monthlyTrendData.length - 1]
    const previous = monthlyTrendData[monthlyTrendData.length - 2]
    
    const change = latest.average - previous.average
    const changePercent = Math.abs(change)
    
    if (change > 1) {
      return {
        type: 'improvement',
        message: `Your performance improved by +${changePercent.toFixed(1)}% compared to last month`,
        color: 'text-green-600'
      }
    } else if (change < -1) {
      return {
        type: 'decline',
        message: `Your performance decreased by ${changePercent.toFixed(1)}% compared to last month`,
        color: 'text-red-600'
      }
    } else {
      return {
        type: 'stable',
        message: 'Performance is stable this month',
        color: 'text-gray-600'
      }
    }
  }, [monthlyTrendData])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    let interval
    const startPolling = async () => {
      interval = setInterval(async () => {
        try {
          const params = performanceLastUpdated ? { since: performanceLastUpdated } : undefined
          const res = await studentsAPI.getMyPerformanceAlerts(params)
          if (res.data.success && res.data.data.hasUpdates) {
            const perfRes = await studentsAPI.getMyPerformance()
            if (perfRes.data.success) {
              setPerformance(perfRes.data.data)
            }
          }
          if (res.data.success && res.data.data.lastUpdated) {
            setPerformanceLastUpdated(res.data.data.lastUpdated)
          }
        } catch (e) {
        }
      }, 20000)
    }

    startPolling()

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [performanceLastUpdated])

  const fetchDashboardData = async () => {
    try {
      const [profileRes, perfRes, jobsRes, notificationsRes] = await Promise.all([
        usersAPI.getProfile(),
        studentsAPI.getMyPerformance(),
        jobsAPI.getJobs({ limit: 5 }),
        notificationsAPI.getRecent()
      ])

      if (profileRes.data.success) {
        setProfile(profileRes.data.data)
      }

      if (perfRes.data.success) {
        setPerformance(perfRes.data.data)
        if (perfRes.data.data?.lastUpdated) {
          setPerformanceLastUpdated(perfRes.data.data.lastUpdated)
        }
      }

      if (jobsRes.data.success) {
        setJobMatches(jobsRes.data.data.jobs)
      }

      if (notificationsRes.data.success) {
        setNotifications(notificationsRes.data.data.notifications)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  const studentProfile = profile?.studentProfile
  const tests = studentProfile?.tests || []

  // Single source of truth: use the same server-provided overallPerformance as the Performance page
  const aggregatePercentage = performance?.overallPerformance?.averagePercentage

  const testScoreData = tests?.map((test, index) => ({
    name: `Test ${index + 1}`,
    score: (test.score / test.maxScore) * 100,
    date: new Date(test.date).toLocaleDateString()
  })) || []

  const skillsRadarData = studentProfile?.skills?.map(skill => ({
    skill: skill.name,
    level: skill.level,
    fullMark: 100
  })) || []

  const getStatusBadge = (status) => {
    const styles = {
      not_requested: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
      not_approved: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
      pending: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800',
      approved: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800',
      rejected: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800',
      shortlisted: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
      placed: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800',
      removed: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'
    }
    return styles[status] || 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'
  }

  const getStatusText = (status) => {
    const texts = {
      not_requested: 'Not Requested',
      not_approved: 'Pending Approval',
      pending: 'Pending Review',
      approved: 'Ready for Placement',
      rejected: 'Rejected',
      shortlisted: 'Shortlisted',
      placed: 'Placed',
      removed: 'Removed from Placement'
    }
    return texts[status] || status
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-500 to-indigo-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name?.first}!
        </h1>
        <p className="text-primary-100">
          Track your progress, explore job opportunities, and stay updated with your placement journey.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrophyIcon className="h-6 w-6 sm:h-8 sm:w-8 text-warning-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Aggregate Score</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                {aggregatePercentage != null ? `${aggregatePercentage.toFixed(1)}%` : '0%'}
              </p>
              {aggregatePercentage == null && (
                <p className="mt-1 text-xs text-gray-500">No evaluations available yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-success-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Placement Status</p>
              <span className={getStatusBadge(studentProfile?.placementStatus)}>
                {getStatusText(studentProfile?.placementStatus)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AcademicCapIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Skills</p>
              <p className="text-2xl font-semibold text-gray-900">
                {studentProfile?.skills?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BriefcaseIcon className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Job Matches</p>
              <p className="text-2xl font-semibold text-gray-900">
                {jobMatches.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Test Score Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Performance Trend</h3>
            {trendInsight && (
              <p className={`mt-1 text-sm ${trendInsight.color}`}>
                {trendInsight.message}
              </p>
            )}
          </div>
          {monthlyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Average Score (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [`${value.toFixed(1)}%`, 'Average Score']}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-900 mb-1">No performance data yet</p>
              <p className="text-xs text-gray-500 text-center mb-4">
                Your trainer will record evaluations here once they assess your performance.
              </p>
              <Link
                to="/student/performance"
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors"
              >
                View Performance Details
              </Link>
            </div>
          )}
        </div>

        {/* Skills Radar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Skills Overview</h3>
          {skillsRadarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={skillsRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Skill Level"
                  dataKey="level"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Tooltip formatter={(value) => [`${value}%`, 'Level']} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <AcademicCapIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No skills data available</p>
                <Link to="/profile" className="text-primary-600 hover:text-primary-500 text-sm">
                  Add skills to your profile
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Matches */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Job Matches</h3>
            <Link to="/jobs" className="text-primary-600 hover:text-primary-500 text-sm font-medium">
              View all
            </Link>
          </div>
          
          {jobMatches.length > 0 ? (
            <div className="space-y-4">
              {jobMatches.slice(0, 3).map((job) => (
                <div key={job._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{job.title}</h4>
                      <p className="text-sm text-gray-600">{job.company.name}</p>
                      <p className="text-sm text-gray-500">{job.location}</p>
                      {job.matchScore && (
                        <div className="mt-2">
                          <span className="badge badge-primary">
                            {Math.round(job.matchScore)}% match
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <Link
                        to={`/jobs/${job._id}`}
                        className="btn-primary text-xs px-3 py-1"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BriefcaseIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No job matches found</p>
              <p className="text-sm">Complete your profile to get better matches</p>
            </div>
          )}
        </div>

        {/* Recent Notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Notifications</h3>
            <Link to="/notifications" className="text-primary-600 hover:text-primary-500 text-sm font-medium">
              View all
            </Link>
          </div>
          
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.slice(0, 4).map((notification) => (
                <div key={notification._id} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    notification.isRead ? 'bg-gray-300' : 'bg-primary-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${
                      notification.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'
                    }`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ClockIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No recent notifications</p>
            </div>
          )}
        </div>
      </div>

      {/* Latest Trainer Remarks */}
      {studentProfile?.trainerRemarks?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Latest Trainer Feedback</h3>
          <div className="space-y-4">
            {studentProfile.trainerRemarks.slice(-2).reverse().map((remark, index) => (
              <div key={index} className="border-l-4 border-primary-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">
                    {remark.trainerId?.name?.first} {remark.trainerId?.name?.last}
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < remark.rating ? 'text-warning-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(remark.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{remark.remark}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentDashboard
