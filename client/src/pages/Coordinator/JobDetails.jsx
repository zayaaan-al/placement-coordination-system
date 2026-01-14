import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiEdit2, FiTrash2, FiXCircle, FiUsers, FiInfo } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { jobsAPI } from '../../services/api'

const statusBadge = (status) => {
  if (status === 'open') return 'bg-green-50 text-green-700 border-green-200'
  if (status === 'closed') return 'bg-gray-50 text-gray-700 border-gray-200'
  if (status === 'draft') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-gray-50 text-gray-700 border-gray-200'
}

const formatDateTime = (dateLike) => {
  if (!dateLike) return '—'
  const d = new Date(dateLike)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

const formatDate = (dateLike) => {
  if (!dateLike) return '—'
  const d = new Date(dateLike)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString()
}

const JobDetails = () => {
  const { jobId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = React.useState(true)
  const [job, setJob] = React.useState(null)
  const [activeTab, setActiveTab] = React.useState('overview')
  const [closing, setClosing] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  const load = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await jobsAPI.getJobById(jobId)
      if (res?.data?.success) {
        setJob(res.data.data)
      } else {
        setJob(null)
      }
    } catch (e) {
      console.error('Failed to load job details:', e)
      toast.error('Failed to load job')
      setJob(null)
    } finally {
      setLoading(false)
    }
  }, [jobId])

  React.useEffect(() => {
    load()
  }, [load])

  const onCloseJob = async () => {
    if (!job?._id) return
    const ok = window.confirm('Close this job?')
    if (!ok) return

    try {
      setClosing(true)
      const res = await jobsAPI.closeJob(job._id)
      if (res?.data?.success) {
        toast.success('Job closed')
        await load()
      } else {
        toast.error('Failed to close job')
      }
    } catch (e) {
      console.error('Close job failed:', e)
      toast.error(e?.response?.data?.error || 'Failed to close job')
    } finally {
      setClosing(false)
    }
  }

  const onDeleteJob = async () => {
    if (!job?._id) return
    const ok = window.confirm('Delete this job? This will remove it from active listings.')
    if (!ok) return

    try {
      setDeleting(true)
      const res = await jobsAPI.deleteJob(job._id)
      if (res?.data?.success) {
        toast.success('Job deleted')
        navigate('/dashboard/job-management')
      } else {
        toast.error('Failed to delete job')
      }
    } catch (e) {
      console.error('Delete job failed:', e)
      toast.error(e?.response?.data?.error || 'Failed to delete job')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job not found</h1>
          <p className="text-gray-600">The job you’re looking for doesn’t exist or you don’t have access.</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/job-management')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Back to Job Management
        </button>
      </div>
    )
  }

  const applicants = Array.isArray(job.applicants) ? job.applicants : []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard/job-management')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
              aria-label="Back"
            >
              <FiArrowLeft />
            </button>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{job.title || '—'}</h1>
              <p className="text-gray-600 truncate">{job.company?.name || '—'} • {job.location || '—'}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge(job.status)}`}>
              {job.status || '—'}
            </span>
            {!job.isActive && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200">
                Deleted
              </span>
            )}
            <span className="text-xs text-gray-500">Created {formatDate(job.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/dashboard/job-management/${job._id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FiEdit2 className="mr-2" />
            Edit
          </Link>

          <button
            onClick={onCloseJob}
            disabled={closing || job.status === 'closed'}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiXCircle className="mr-2" />
            {closing ? 'Closing...' : 'Close'}
          </button>

          <button
            onClick={onDeleteJob}
            disabled={deleting || !job.isActive}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiTrash2 className="mr-2" />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              <FiInfo className="mr-2" />
              Overview
            </button>
            <button
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'applicants'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('applicants')}
            >
              <FiUsers className="mr-2" />
              Applicants ({applicants.length})
            </button>
            <button
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'activity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('activity')}
            >
              Activity Log
            </button>
          </nav>
        </div>

        <div className="pt-4">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {job.description || '—'}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {(job.requiredSkills || []).length > 0 ? (
                      (job.requiredSkills || []).map((s, idx) => (
                        <span key={`${s.name || 'skill'}-${idx}`} className="inline-flex items-center rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-700">
                          {s?.name || '—'} ({s?.minLevel ?? '—'}+)
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">—</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Job Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-gray-500">Job Type</span>
                      <span className="text-gray-900 capitalize">{job.jobType || '—'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-gray-500">Positions</span>
                      <span className="text-gray-900">{job.positions ?? '—'}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-gray-500">Min Score</span>
                      <span className="text-gray-900">{job.minAggregateScore ?? '—'}%</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-gray-500">Deadline</span>
                      <span className="text-gray-900">{formatDate(job.deadline)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-gray-500">Views</span>
                      <span className="text-gray-900">{job.views ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Eligibility</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="text-gray-500">Batches</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {(job.eligibleBatches || []).length > 0 ? (
                          (job.eligibleBatches || []).map((b, idx) => (
                            <span key={`${b}-${idx}`} className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs text-blue-700">
                              {b}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-700">All</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-500">Programs</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {(job.eligiblePrograms || []).length > 0 ? (
                          (job.eligiblePrograms || []).map((p, idx) => (
                            <span key={`${p}-${idx}`} className="inline-flex items-center rounded-full bg-gray-50 border border-gray-200 px-3 py-1 text-xs text-gray-700">
                              {p}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-700">All</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'applicants' && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {applicants.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Match</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applied On</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {applicants.map((a, idx) => {
                        const user = a?.studentId
                        const name = `${user?.name?.first || ''} ${user?.name?.last || ''}`.trim() || '—'
                        return (
                          <tr key={a?._id || `${user?._id || 'app'}-${idx}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user?.email || '—'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                                {a?.status || '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{typeof a?.matchScore === 'number' ? `${Math.round(a.matchScore)}%` : '—'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(a?.appliedDate)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <FiUsers className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No applicants yet</h3>
                  <p className="mt-1 text-gray-500">Students who apply will show up here.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500">Created</div>
                <div className="text-sm text-gray-900">{formatDateTime(job.createdAt)}</div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500">Last Updated</div>
                <div className="text-sm text-gray-900">{formatDateTime(job.updatedAt)}</div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-500">Status</div>
                <div className="text-sm text-gray-900">{job.status || '—'}</div>
              </div>
              {!job.isActive && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="text-sm text-red-700 font-medium">This job was deleted</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JobDetails
