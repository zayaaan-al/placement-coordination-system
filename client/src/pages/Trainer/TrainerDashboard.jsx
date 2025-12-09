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

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [studentsRes, analyticsRes, pendingRes] = await Promise.all([
        trainersAPI.getTrainerStudents(user._id, { limit: 10 }),
        trainersAPI.getTrainerAnalytics(user._id),
        trainersAPI.getPendingStudents()
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

      // Calculate basic stats
      const totalStudents = studentsRes.data.data.students.length
      const avgScore = studentsRes.data.data.students.reduce((sum, s) => sum + s.aggregateScore, 0) / totalStudents || 0
      const approvedStudents = studentsRes.data.data.students.filter(s => s.placementStatus === 'approved').length

      setStats({
        totalStudents,
        avgScore: Math.round(avgScore),
        approvedStudents,
        totalEvaluations: analyticsRes.data.data.evaluationStats?.totalEvaluations || 0
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
              <AcademicCapIcon className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Approved Students</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.approvedStudents || 0}
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Skills Evaluated</h3>
          {skillsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={skillsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {skillsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <StarIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No skills data available</p>
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

        {students.length > 0 ? (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.slice(0, 5).map((student) => (
                  <tr key={student._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {student.userId?.name?.first?.[0]}{student.userId?.name?.last?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {student.userId?.name?.first} {student.userId?.name?.last}
                          </p>
                          <p className="text-sm text-gray-500">{student.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="text-sm text-gray-900">{student.rollNo}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="text-sm text-gray-900">{student.batch}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="text-sm font-medium text-gray-900">
                        {student.aggregateScore}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Approved
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.trainerRemarks && student.trainerRemarks.length > 0 ? (
                        <span className="text-sm text-gray-700">Has remarks</span>
                      ) : (
                        <span className="text-sm text-gray-400">No remarks</span>
                      )}
                    </td>
                    
                  </tr>
                ))}
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
        <Link to="/students" className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-warning-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              <p className="text-sm text-gray-600">
                {analytics?.evaluationStats?.totalEvaluations || 0} evaluations this month
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrainerDashboard
