import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { trainersAPI, studentsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import {
  UserGroupIcon,
  ChartBarIcon,
  AcademicCapIcon,
  TrophyIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

const TrainerDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [students, setStudents] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pendingStudents, setPendingStudents] = useState([])
  const [recentStudents, setRecentStudents] = useState([])
  const [statsHighlight, setStatsHighlight] = useState(false)
  const [activityHighlight, setActivityHighlight] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Subtle highlight when summary stats update
  useEffect(() => {
    if (!stats) return
    setStatsHighlight(true)
    const timeout = setTimeout(() => setStatsHighlight(false), 800)
    return () => clearTimeout(timeout)
  }, [stats?.avgScore, stats?.totalEvaluations, stats?.totalStudents])

  const fetchDashboardData = async () => {
    try {
      const [studentsRes, analyticsRes, pendingRes, recentStudentsRes] = await Promise.all([
        trainersAPI.getTrainerStudents(user._id, { limit: 10 }),
        trainersAPI.getTrainerAnalytics(user._id),
        trainersAPI.getPendingStudents(),
        trainersAPI.getRecentEvaluatedStudents()
      ])

      if (studentsRes.data.success) {
        setStudents(studentsRes.data.data.students)
      }

      if (analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.data)
      }

      if (pendingRes.data.success) {
        setPendingStudents(pendingRes.data.data || [])
      }

      if (recentStudentsRes.data.success) {
        setRecentStudents(recentStudentsRes.data.data || [])
      }

      // Calculate basic stats using real trainer evaluation analytics
      const totalStudents = studentsRes.data.data.students.length
      const approvedStudents = studentsRes.data.data.students.filter(s => s.placementStatus === 'approved').length
      const totalEvaluations = analyticsRes.data.data.evaluationStats?.totalEvaluations || 0
      const avgScorePercentage = analyticsRes.data.data.evaluationStats?.avgScorePercentage || 0

      setStats({
        totalStudents,
        avgScore: Math.round(avgScorePercentage),
        approvedStudents,
        totalEvaluations
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load trainer dashboard analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleStudentApproval = async (studentProfileId, status) => {
    try {
      await trainersAPI.updateStudentApproval(studentProfileId, status)
      toast.success(`Student ${status} successfully`)

      // Refresh pending list and main students list
      const [studentsRes, pendingRes] = await Promise.all([
        trainersAPI.getTrainerStudents(user._id, { limit: 10 }),
        trainersAPI.getPendingStudents()
      ])

      if (studentsRes.data.success) {
        setStudents(studentsRes.data.data.students)
      }

      if (pendingRes.data.success) {
        setPendingStudents(pendingRes.data.data || [])
      }
    } catch (error) {
      console.error('Error updating student approval:', error)
      toast.error('Failed to update student status')
    }
  }

  const performanceData = analytics?.monthlyTrend?.map(item => ({
    month: `${item._id.month}/${item._id.year}`,
    evaluations: item.count,
    avgRating: item.avgRating
  })) || []

  const skillsData = analytics?.skillStats?.slice(0, 6).map(skill => ({
    name: skill._id,
    score: Math.round(skill.avgScore),
    count: skill.count
  })) || []

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  const evalStats = analytics?.evaluationStats || {}

  // Highlight recent activity when this-month count changes
  useEffect(() => {
    if (evalStats.evaluationsThisMonth == null) return
    setActivityHighlight(true)
    const timeout = setTimeout(() => setActivityHighlight(false), 800)
    return () => clearTimeout(timeout)
  }, [evalStats.evaluationsThisMonth])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">
          Welcome back, {user?.name?.first}!
        </h1>
        <p className="text-indigo-100 text-sm sm:text-base">
          Track your students' progress and manage evaluations effectively.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition ${
          statsHighlight ? 'ring-2 ring-primary-200 bg-primary-50/40' : ''
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalStudents || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrophyIcon className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Score</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.avgScore || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Evaluations</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalEvaluations || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Evaluation Activity</h3>
          {performanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="evaluations" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No evaluation data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Skills Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Top Skills Evaluated</h3>
          <p className="text-xs text-gray-500 mb-3">Ranked by average score and frequency.</p>
          {skillsData.length > 0 ? (
            <div className="space-y-3">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={skillsData}
                    layout="vertical"
                    margin={{ top: 5, right: 16, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                    <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name, props) => {
                        if (name === 'Average score') return [`${value}%`, name]
                        if (name === 'Evaluations') return [value, name]
                        return [value, name]
                      }}
                    />
                    <Bar dataKey="score" name="Average score" fill="#6366f1" radius={[4, 4, 4, 4]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-1 text-xs">
                {skillsData.map((skill, idx) => (
                  <li key={skill.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-gray-800">{skill.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">{skill.score}%</span>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                        {skill.count} evals
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
              <div className="text-center">
                <StarIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p>No skills data available yet.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Students */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Students</h3>
          <Link to="/students" className="text-primary-600 hover:text-primary-500 text-sm font-medium">
            View all students
          </Link>
        </div>

        {recentStudents.length > 0 ? (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentStudents.map((entry) => {
                  const studentName = `${entry.studentUser?.name?.first || ''} ${entry.studentUser?.name?.last || ''}`.trim()
                  const email = entry.studentUser?.email
                  return (
                  <tr key={entry.studentProfileId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {studentName?.[0] || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {studentName}
                          </p>
                          <p className="text-sm text-gray-500">{email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="text-sm text-gray-900">{entry.studentProfile?.rollNo}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="text-sm text-gray-900">{entry.studentProfile?.batch}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Approved
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.notes ? (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 max-w-xs truncate">
                          {entry.notes}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">No remarks</span>
                      )}
                    </td>
                    
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <UserGroupIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No students assigned yet</p>
          </div>
        )}
      </div>

      {/* Pending Student Requests */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Pending Student Requests</h3>
          <p className="text-sm text-gray-500">{pendingStudents.length} pending</p>
        </div>

        {pendingStudents.length > 0 ? (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested On</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingStudents.map((sp) => (
                  <tr key={sp._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {sp.userId?.name?.first?.[0]}{sp.userId?.name?.last?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {sp.userId?.name?.first} {sp.userId?.name?.last}
                          </p>
                          <p className="text-sm text-gray-500">{sp.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sp.program}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sp.batch}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sp.createdAt ? new Date(sp.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 space-x-2">
                      <button
                        onClick={() => handleStudentApproval(sp._id, 'approved')}
                        className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleStudentApproval(sp._id, 'rejected')}
                        className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <UserGroupIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No pending student requests</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/evaluations" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Manage Students</h3>
              <p className="text-sm text-gray-600">View and evaluate your assigned students</p>
            </div>
          </div>
        </Link>

        <Link to="/analytics" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-success-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">View Analytics</h3>
              <p className="text-sm text-gray-600">Detailed performance analytics and reports</p>
            </div>
          </div>
        </Link>

        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition ${
          activityHighlight ? 'ring-2 ring-warning-200 bg-amber-50/40' : ''
        }`}>
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-warning-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              <p className="text-sm text-gray-600">
                {evalStats.evaluationsThisMonth || 0} evaluations this month
              </p>
              {evalStats.lastEvaluationAt && (
                <p className="text-xs text-gray-500 mt-0.5">
                  Last evaluation on {new Date(evalStats.lastEvaluationAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrainerDashboard
