import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { placementRequestsAPI, trainersAPI } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { UserGroupIcon } from '@heroicons/react/24/outline'

const StudentList = () => {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  const getScoreColorClass = (score) => {
    if (score == null || Number.isNaN(score)) return 'text-gray-500'
    if (score >= 70) return 'text-emerald-600'
    if (score >= 40) return 'text-amber-600'
    return 'text-red-600'
  }

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await trainersAPI.getTrainerStudents(user._id, { limit: 100 })
        if (res.data.success) {
          setStudents(res.data.data.students || [])
        }
      } catch (error) {
        console.error('Error fetching trainer students:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user?._id) {
      fetchStudents()
    }
  }, [user])

  const refreshStudents = async () => {
    const res = await trainersAPI.getTrainerStudents(user._id, { limit: 100 })
    if (res.data.success) {
      setStudents(res.data.data.students || [])
    }
  }

  const handleUnmoveFromPlacement = async (student) => {
    try {
      const ok = window.confirm('Cancel this placement request? This will remove it from the admin list and reset the student placement status.')
      if (!ok) return

      await placementRequestsAPI.cancel(student._id)
      toast.success('Placement request cancelled')
      await refreshStudents()
    } catch (error) {
      console.error('Error cancelling placement request:', error)
      toast.error(error?.response?.data?.error || 'Failed to cancel placement request')
    }
  }

  const handleRemoveStudent = async (studentProfileId) => {
    try {
      await trainersAPI.updateStudentApproval(studentProfileId, 'rejected')
      toast.success('Student removed from your list')

      await refreshStudents()
    } catch (error) {
      console.error('Error removing student:', error)
      toast.error('Failed to remove student')
    }
  }

  const handleMoveToPlacement = async (student) => {
    try {
      const ok = window.confirm('Move this student to placement workflow? This will create a pending request for admin approval.')
      if (!ok) return

      await placementRequestsAPI.create({ studentProfileId: student._id })
      toast.success('Placement request created (pending approval)')
      await refreshStudents()
    } catch (error) {
      console.error('Error creating placement request:', error)
      toast.error(error?.response?.data?.error || 'Failed to create placement request')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <p className="text-gray-600">View and manage students assigned to you (approved only)</p>
      </div>

      {students.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500.uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map(student => (
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
                          <p className="text-sm font-medium text.gray-900">
                            {student.userId?.name?.first} {student.userId?.name?.last}
                          </p>
                          <p className="text-sm text-gray-500">{student.userId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.rollNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.program}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.batch}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${getScoreColorClass(student.avgScorePercentage)}`}>
                      {student.avgScorePercentage == null ? '—' : `${Math.round(student.avgScorePercentage)}%`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.placementStatus === 'pending' ? (
                        <button
                          onClick={() => handleUnmoveFromPlacement(student)}
                          className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 mr-2"
                        >
                          Unmove from Placement
                        </button>
                      ) : student.placementStatus === 'approved' || student.placementStatus === 'rejected' || student.placementStatus === 'placed' ? (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200 mr-2">
                          {student.placementStatus}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMoveToPlacement(student)}
                          className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 mr-2"
                        >
                          Move to Placement
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveStudent(student._id)}
                        className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-10 text-center text-gray-500">
          <div className="flex flex-col items-center">
            <UserGroupIcon className="h-12 w-12 text-gray-300 mb-3" />
            <p>No approved students assigned yet.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentList
