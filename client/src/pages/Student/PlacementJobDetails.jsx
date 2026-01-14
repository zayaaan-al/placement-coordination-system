import React from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { studentJobsAPI, usersAPI, studentsAPI } from '../../services/api'

const formatSalary = (salary) => {
  if (!salary) return 'Not specified'
  const { min, max, currency = 'INR' } = salary
  if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`
  if (min) return `${currency} ${min.toLocaleString()}+`
  return 'Not specified'
}

const PlacementJobDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = React.useState(true)
  const [job, setJob] = React.useState(null)
  const [applying, setApplying] = React.useState(false)
  const [myAggregateScore, setMyAggregateScore] = React.useState(null)

  const load = React.useCallback(async () => {
    try {
      setLoading(true)
      const [jobRes, perfRes, profileRes] = await Promise.all([
        studentJobsAPI.getPlacementJobById(id),
        studentsAPI.getMyPerformance(),
        usersAPI.getProfile(),
      ])

      if (jobRes?.data?.success) {
        setJob(jobRes.data.data)
      } else {
        setJob(null)
      }

      const jobEffective = jobRes?.data?.data?.effectiveAggregateScore
      if (typeof jobEffective === 'number') {
        setMyAggregateScore(jobEffective)
        return
      }

      const perfAgg = perfRes?.data?.data?.overallPerformance?.averagePercentage
      if (typeof perfAgg === 'number') {
        setMyAggregateScore(perfAgg)
        return
      }

      if (profileRes?.data?.success) {
        const agg = profileRes?.data?.data?.studentProfile?.aggregateScore
        setMyAggregateScore(typeof agg === 'number' ? agg : null)
      }
    } catch (e) {
      const status = e?.response?.status
      if (status === 403) {
        toast.error('You are not eligible for placement opportunities yet.')
        navigate('/dashboard')
        return
      }
      toast.error(e?.response?.data?.error || 'Failed to fetch job details')
      navigate('/student/jobs')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  React.useEffect(() => {
    load()
  }, [load])

  const onApply = async () => {
    if (!job?._id) return

    const minAgg = typeof job?.minAggregateScore === 'number' ? job.minAggregateScore : null
    if (typeof minAgg === 'number' && typeof myAggregateScore === 'number' && myAggregateScore < minAgg) {
      toast.error('You do not meet the minimum aggregate score requirement')
      return
    }

    try {
      setApplying(true)
      const res = await studentJobsAPI.applyToPlacementJob(job._id)
      if (res?.data?.success) {
        toast.success('Successfully applied for this job.')
        setJob((p) => ({ ...p, hasApplied: true, applicationStatus: 'applied' }))
      } else {
        toast.error('Failed to apply')
      }
    } catch (e) {
      const status = e?.response?.status
      if (status === 403) {
        toast.error('You are not eligible for placement opportunities yet.')
        navigate('/dashboard')
        return
      }
      const code = e?.response?.data?.code
      const message = e?.response?.data?.error
      const data = e?.response?.data?.data

      if (code === 'ALREADY_APPLIED') {
        toast.success('You have already applied for this job.')
        setJob((p) => ({ ...p, hasApplied: true, applicationStatus: 'applied' }))
        return
      }

      if (code === 'MIN_AGGREGATE_NOT_MET') {
        const eff = typeof data?.effectiveAggregateScore === 'number' ? data.effectiveAggregateScore : myAggregateScore
        const min = typeof data?.minAggregateScore === 'number' ? data.minAggregateScore : job?.minAggregateScore
        if (typeof eff === 'number' && typeof min === 'number') {
          toast.error(`Minimum aggregate required is ${Math.round(min)}%. Your aggregate is ${Math.round(eff)}%.`)
          return
        }
      }

      toast.error(message || 'Failed to apply')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Job not found</h3>
        <Link to="/student/jobs" className="btn-primary">
          Back to Jobs
        </Link>
      </div>
    )
  }

  const isClosed = job.status !== 'open'
  const hasApplied = job.hasApplied === true
  const minAgg = typeof job?.minAggregateScore === 'number' ? job.minAggregateScore : null
  const meetsMinAgg =
    typeof minAgg !== 'number' || typeof myAggregateScore !== 'number' ? true : myAggregateScore >= minAgg
  const applyDisabled = applying || hasApplied || isClosed || !meetsMinAgg

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/student/jobs')} className="btn-secondary">
          Back
        </button>
        <button
          onClick={onApply}
          disabled={applyDisabled}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {hasApplied ? 'Applied' : isClosed ? 'Closed' : !meetsMinAgg ? 'Not Eligible' : applying ? 'Applying...' : 'Apply'}
        </button>
      </div>

      {typeof minAgg === 'number' && (
        <div className={`rounded-lg border p-4 ${meetsMinAgg ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`text-sm font-medium ${meetsMinAgg ? 'text-emerald-800' : 'text-red-800'}`}>
            Minimum aggregate required: {minAgg}%
          </div>
          <div className={`text-sm mt-1 ${meetsMinAgg ? 'text-emerald-700' : 'text-red-700'}`}>
            Your aggregate: {typeof myAggregateScore === 'number' ? `${myAggregateScore}%` : '—'}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-gray-600">{job.company?.name} • {job.location}</p>
          </div>
          <div>
            {hasApplied ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                Applied
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Open
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">Salary / CTC</div>
            <div className="text-sm font-medium text-gray-900 mt-1">{formatSalary(job.salary)}</div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">Deadline</div>
            <div className="text-sm font-medium text-gray-900 mt-1">{job.deadline ? new Date(job.deadline).toLocaleString() : '—'}</div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500">Job Type</div>
            <div className="text-sm font-medium text-gray-900 mt-1 capitalize">{job.jobType || '—'}</div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900">Description</h2>
          <p className="mt-2 text-gray-700 whitespace-pre-wrap">{job.description}</p>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900">Required Skills</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {(job.requiredSkills || []).length ? (
              (job.requiredSkills || []).map((s, idx) => (
                <span key={`${s.name}-${idx}`} className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                  {s.name} ({s.minLevel}+)
                </span>
              ))
            ) : (
              <span className="text-sm text-gray-500">—</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlacementJobDetails
