import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usersAPI, jobsAPI, notificationsAPI } from '../../services/api'
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
  const [jobMatches, setJobMatches] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [profileRes, jobsRes, notificationsRes] = await Promise.all([
        usersAPI.getProfile(),
        jobsAPI.getJobs({ limit: 5 }),
        notificationsAPI.getRecent()
      ])

      if (profileRes.data.success) {
        setProfile(profileRes.data.data)
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
  const testScoreData = studentProfile?.tests?.map((test, index) => ({
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
      not_approved: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
      approved: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800',
      shortlisted: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
      placed: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
    }
    return styles[status] || 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'
  }

  const getStatusText = (status) => {
    const texts = {
      not_approved: 'Pending Approval',
      approved: 'Approved',
      shortlisted: 'Shortlisted',
      placed: 'Placed'
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
                {studentProfile?.aggregateScore || 0}%
              </p>
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
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Test Score Trend</h3>
          {testScoreData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={testScoreData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value) => [`${value.toFixed(1)}%`, 'Score']}
                  labelFormatter={(label, payload) => {
                    const data = payload?.[0]?.payload
                    return data ? `${label} (${data.date})` : label
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No test data available</p>
              </div>
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
