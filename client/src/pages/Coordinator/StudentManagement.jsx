import React, { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { studentsAPI } from '../../services/api'

const getStatusBadgeClass = (status) => {
  if (status === 'placed') return 'bg-blue-100 text-blue-800'
  if (status === 'removed') return 'bg-red-100 text-red-800'
  return 'bg-emerald-100 text-emerald-800'
}

const getStatusLabel = (status) => {
  if (status === 'placed') return 'Placed'
  if (status === 'removed') return 'Removed'
  return 'Ready'
}

const StudentManagement = () => {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [filter, setFilter] = useState('all')

  const [placeModalOpen, setPlaceModalOpen] = useState(false)
  const [placingStudent, setPlacingStudent] = useState(null)
  const [placeForm, setPlaceForm] = useState({ company: '', role: '', package: '', date: '' })

  const placementStatusParam = useMemo(() => {
    if (filter === 'ready') return 'approved'
    if (filter === 'placed') return 'placed'
    if (filter === 'removed') return 'removed'
    return 'approved,placed,removed'
  }, [filter])

  const loadStudents = async () => {
    try {
      setLoading(true)

      const params = {
        limit: 200,
        placementStatus: placementStatusParam,
      }

      if (filter === 'ready') {
        params.placementEligible = true
      }

      const res = await studentsAPI.getStudents(params)
      if (res.data.success) {
        setStudents(res.data.data.students || [])
      }
    } catch (error) {
      console.error('Failed to load students:', error)
      toast.error(error?.response?.data?.error || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const openPlaceModal = (student) => {
    setPlacingStudent(student)
    setPlaceForm({ company: '', role: '', package: '', date: '' })
    setPlaceModalOpen(true)
  }

  const closePlaceModal = () => {
    setPlaceModalOpen(false)
    setPlacingStudent(null)
  }

  const handlePlaceStudent = async (e) => {
    e.preventDefault()
    try {
      if (!placingStudent?._id) return

      const payload = {
        company: placeForm.company || '',
        role: placeForm.role || '',
        package: placeForm.package === '' ? null : Number(placeForm.package),
        date: placeForm.date ? new Date(placeForm.date) : null,
      }

      await studentsAPI.placeStudent(placingStudent._id, payload)
      toast.success('Student marked as placed')
      closePlaceModal()
      await loadStudents()
    } catch (error) {
      console.error('Place student failed:', error)
      toast.error(error?.response?.data?.error || 'Failed to place student')
    }
  }

  const handleRemoveFromPlacement = async (student) => {
    try {
      const ok = window.confirm('Remove this student from placement?')
      if (!ok) return

      const remarks = window.prompt('Remarks (optional):') || ''
      await studentsAPI.removeFromPlacement(student._id, { remarks })
      toast.success('Student removed from placement')
      await loadStudents()
    } catch (error) {
      console.error('Remove from placement failed:', error)
      toast.error(error?.response?.data?.error || 'Failed to remove student from placement')
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600">Manage placement readiness, placement status, and lifecycle actions.</p>
        </div>
        <button
          onClick={loadStudents}
          className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border ${filter === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('ready')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border ${filter === 'ready' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            Ready
          </button>
          <button
            onClick={() => setFilter('placed')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border ${filter === 'placed' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            Placed
          </button>
          <button
            onClick={() => setFilter('removed')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border ${filter === 'removed' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            Removed
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  const user = student.userId
                  const name = `${user?.name?.first || ''} ${user?.name?.last || ''}`.trim() || '—'
                  const email = user?.email || '—'
                  const rawScore = typeof student.overallScore === 'number'
                    ? student.overallScore
                    : typeof student.aggregateScore === 'number'
                      ? student.aggregateScore
                      : null
                  const score = typeof rawScore === 'number' ? Math.round(rawScore) : null

                  const status = student.placementStatus
                  const isReady = status === 'approved' && student.placementEligible === true
                  const isPlaced = status === 'placed'
                  const isRemoved = status === 'removed'

                  const badgeClass = getStatusBadgeClass(isPlaced ? 'placed' : isRemoved ? 'removed' : 'ready')
                  const badgeLabel = getStatusLabel(isPlaced ? 'placed' : isRemoved ? 'removed' : 'ready')

                  return (
                    <tr key={student._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.rollNo || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.program || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.batch || '—'}</td>
                      <td
                        className={clsx(
                          'px-6 py-4 whitespace-nowrap text-sm',
                          score == null && 'text-gray-500',
                          score != null && score >= 70 && 'text-green-600',
                          score != null && score >= 40 && score < 70 && 'text-yellow-600',
                          score != null && score < 40 && 'text-red-600'
                        )}
                        title={score == null ? 'No evaluations yet' : undefined}
                      >
                        {score == null ? '—' : `${score}%`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
                          {badgeLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isReady ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => openPlaceModal(student)}
                              className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
                            >
                              Place Student
                            </button>
                            <button
                              onClick={() => handleRemoveFromPlacement(student)}
                              className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                            >
                              Remove from Placement
                            </button>
                          </div>
                        ) : isPlaced ? (
                          <span className="text-xs text-gray-500">Placed</span>
                        ) : (
                          <span className="text-xs text-gray-500">No actions</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center text-gray-500">No students found for this filter.</div>
        )}
      </div>

      {placeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black bg-opacity-40" onClick={closePlaceModal} />
          <div className="relative bg-white w-full max-w-lg rounded-lg shadow-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Place Student</h2>
                <p className="text-sm text-gray-600">Enter placement details (optional) and confirm placement.</p>
              </div>
              <button onClick={closePlaceModal} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <form onSubmit={handlePlaceStudent} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <input
                  value={placeForm.company}
                  onChange={(e) => setPlaceForm((p) => ({ ...p, company: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <input
                  value={placeForm.role}
                  onChange={(e) => setPlaceForm((p) => ({ ...p, role: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Package</label>
                  <input
                    type="number"
                    value={placeForm.package}
                    onChange={(e) => setPlaceForm((p) => ({ ...p, package: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={placeForm.date}
                    onChange={(e) => setPlaceForm((p) => ({ ...p, date: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closePlaceModal}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  Confirm Placement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentManagement
