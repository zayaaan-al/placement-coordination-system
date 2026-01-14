import React from 'react'
import { Link } from 'react-router-dom'
import { FiSearch, FiFilter, FiRefreshCcw, FiEye, FiEdit2, FiXCircle, FiTrash2, FiPlus } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { jobsAPI } from '../../services/api'

const statusMeta = {
  open: { label: 'Open', cls: 'bg-green-50 text-green-700 border-green-200' },
  closed: { label: 'Closed', cls: 'bg-gray-50 text-gray-700 border-gray-200' },
  draft: { label: 'Draft', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
}

const formatDate = (dateLike) => {
  if (!dateLike) return '—'
  const d = new Date(dateLike)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString()
}

const JobManagement = () => {
  const [loading, setLoading] = React.useState(true)
  const [jobs, setJobs] = React.useState([])
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filters, setFilters] = React.useState({
    status: 'open',
    jobType: ''
  })

  const [closingId, setClosingId] = React.useState(null)
  const [deletingId, setDeletingId] = React.useState(null)

  const fetchJobs = React.useCallback(async () => {
    try {
      setLoading(true)

      const params = {
        status: filters.status,
        ...(filters.jobType ? { jobType: filters.jobType } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
        limit: 200
      }

      const res = await jobsAPI.getJobs(params)
      if (res?.data?.success) {
        setJobs(res.data.data?.jobs || [])
      } else {
        setJobs([])
      }
    } catch (e) {
      console.error('Fetch jobs failed:', e)
      toast.error('Failed to load jobs')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [filters.jobType, filters.status, searchQuery])

  React.useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const onClose = async (job) => {
    const ok = window.confirm('Close this job?')
    if (!ok) return

    try {
      setClosingId(job._id)
      const res = await jobsAPI.closeJob(job._id)
      if (res?.data?.success) {
        toast.success('Job closed')
        await fetchJobs()
      } else {
        toast.error('Failed to close job')
      }
    } catch (e) {
      console.error('Close job failed:', e)
      toast.error(e?.response?.data?.error || 'Failed to close job')
    } finally {
      setClosingId(null)
    }
  }

  const onDelete = async (job) => {
    const ok = window.confirm('Delete this job? This will remove it from active listings.')
    if (!ok) return

    try {
      setDeletingId(job._id)
      const res = await jobsAPI.deleteJob(job._id)
      if (res?.data?.success) {
        toast.success('Job deleted')
        await fetchJobs()
      } else {
        toast.error('Failed to delete job')
      }
    } catch (e) {
      console.error('Delete job failed:', e)
      toast.error(e?.response?.data?.error || 'Failed to delete job')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Management</h1>
          <p className="text-gray-600">Create and manage job postings</p>
        </div>
        <Link
          to="/dashboard/job-management/create"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <FiPlus className="mr-2" />
          Create Job
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="inline-flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select
                value={filters.status}
                onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="draft">Draft</option>
              </select>
              <select
                value={filters.jobType}
                onChange={(e) => setFilters((p) => ({ ...p, jobType: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">All Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </select>
            </div>

            <button
              onClick={fetchJobs}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <FiRefreshCcw className="mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {jobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Deadline</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {jobs.map((job) => {
                    const meta = statusMeta[job.status] || { label: job.status || '—', cls: 'bg-gray-50 text-gray-700 border-gray-200' }
                    const isBusy = closingId === job._id || deletingId === job._id
                    return (
                      <tr key={job._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-medium text-gray-900">{job.title || '—'}</div>
                          <div className="text-xs text-gray-500 capitalize">{job.jobType || '—'} • {job.positions ?? '—'} positions</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.company?.name || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.location || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${meta.cls}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(job.deadline)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              to={`/dashboard/job-management/${job._id}`}
                              className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
                            >
                              <FiEye className="w-4 h-4 mr-1" />
                              View
                            </Link>

                            <Link
                              to={`/dashboard/job-management/${job._id}/edit`}
                              className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                            >
                              <FiEdit2 className="w-4 h-4 mr-1" />
                              Edit
                            </Link>

                            <button
                              onClick={() => onClose(job)}
                              disabled={isBusy || job.status === 'closed'}
                              className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FiXCircle className="w-4 h-4 mr-1" />
                              {closingId === job._id ? 'Closing...' : 'Close'}
                            </button>

                            <button
                              onClick={() => onDelete(job)}
                              disabled={isBusy || job.isActive === false || job.status !== 'draft'}
                              className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <FiTrash2 className="w-4 h-4 mr-1" />
                              {deletingId === job._id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FiXCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
              <p className="mt-1 text-gray-500">Try adjusting your filters or create a new job.</p>
              <Link
                to="/dashboard/job-management/create"
                className="mt-5 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <FiPlus className="mr-2" />
                Create Job
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default JobManagement
