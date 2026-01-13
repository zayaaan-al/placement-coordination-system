import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { placementRequestsAPI } from '../../services/api'

const PlacementRequests = () => {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const res = await placementRequestsAPI.list({ status: 'pending' })
      if (res.data.success) {
        setRequests(res.data.data || [])
      }
    } catch (error) {
      console.error('Failed to load placement requests:', error)
      toast.error(error?.response?.data?.error || 'Failed to load placement requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApprove = async (requestId) => {
    try {
      const adminRemarks = window.prompt('Remarks (optional):') || ''
      const res = await placementRequestsAPI.approve(requestId, { adminRemarks })
      if (res.data.success) {
        toast.success('Request approved')
        await loadRequests()
      }
    } catch (error) {
      console.error('Approve request error:', error)
      toast.error(error?.response?.data?.error || 'Failed to approve request')
    }
  }

  const handleReject = async (requestId) => {
    try {
      const adminRemarks = window.prompt('Rejection reason (optional):') || ''
      const res = await placementRequestsAPI.reject(requestId, { adminRemarks })
      if (res.data.success) {
        toast.success('Request rejected')
        await loadRequests()
      }
    } catch (error) {
      console.error('Reject request error:', error)
      toast.error(error?.response?.data?.error || 'Failed to reject request')
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placement Requests</h1>
          <p className="text-gray-600">Review trainer recommendations and approve or reject students for placement.</p>
        </div>
        <button
          onClick={loadRequests}
          className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((req) => {
                  const studentUser = req.studentProfileId?.userId
                  const studentName = `${studentUser?.name?.first || ''} ${studentUser?.name?.last || ''}`.trim()
                  const trainerName = `${req.trainerId?.name?.first || ''} ${req.trainerId?.name?.last || ''}`.trim()
                  const avgScore = typeof req.avgScore === 'number' ? `${req.avgScore.toFixed(1)}%` : '—'
                  return (
                    <tr key={req._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{studentName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.studentProfileId?.rollNo || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.studentProfileId?.batch || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trainerName || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{avgScore}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 space-x-2">
                        <button
                          onClick={() => handleApprove(req._id)}
                          className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(req._id)}
                          className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-gray-500">No pending placement requests.</div>
        )}
      </div>
    </div>
  )
}

export default PlacementRequests
