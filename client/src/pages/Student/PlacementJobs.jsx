import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { studentJobsAPI } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'

const formatSalary = (salary) => {
  if (!salary) return 'Not specified'
  const { min, max, currency = 'INR' } = salary
  if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`
  if (min) return `${currency} ${min.toLocaleString()}+`
  return 'Not specified'
}

const formatDate = (dateLike) => {
  if (!dateLike) return '—'
  const d = new Date(dateLike)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString()
}

const PlacementJobs = () => {
  const navigate = useNavigate()

  const [loading, setLoading] = React.useState(true)
  const [jobs, setJobs] = React.useState([])
  const [search, setSearch] = React.useState('')

  const load = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await studentJobsAPI.getPlacementJobs({ limit: 200, search })
      if (res?.data?.success) {
        setJobs(res.data.data.jobs || [])
      } else {
        setJobs([])
      }
    } catch (e) {
      const status = e?.response?.status
      const message = e?.response?.data?.error || 'Failed to load placement jobs'
      if (status === 403) {
        toast.error('You are not eligible for placement opportunities yet.')
        navigate('/dashboard')
        return
      }
      toast.error(message)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [navigate, search])

  React.useEffect(() => {
    load()
  }, [load])

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
          <h1 className="text-2xl font-bold text-gray-900">Placement Jobs</h1>
          <p className="text-gray-600">Browse and apply to open placement opportunities</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role, company..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={load}
            className="btn-primary px-4 py-2"
          >
            Search
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {jobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.company?.name || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.title || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{job.location || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatSalary(job.salary)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(job.deadline)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {job.hasApplied ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Applied
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Open
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        to={`/student/jobs/${job._id}`}
                        className="btn-primary text-xs px-3 py-1"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p className="text-sm font-medium text-gray-900">No placement jobs available right now.</p>
            <p className="text-sm text-gray-500 mt-1">Check back later for new opportunities.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlacementJobs
