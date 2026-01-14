import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { jobsAPI } from '../../services/api'
import JobForm from './components/JobForm'

const EditJob = () => {
  const { jobId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = React.useState(true)
  const [job, setJob] = React.useState(null)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await jobsAPI.getJobById(jobId)
        if (res?.data?.success) {
          setJob(res.data.data)
        } else {
          setJob(null)
        }
      } catch (e) {
        console.error('Load job failed:', e)
        toast.error('Failed to load job')
        setJob(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [jobId])

  const onSubmit = async (payload) => {
    if (!job?._id) return

    try {
      setSubmitting(true)
      const res = await jobsAPI.updateJob(job._id, payload)
      if (res?.data?.success) {
        toast.success('Job updated')
        navigate(`/dashboard/job-management/${job._id}`)
      } else {
        toast.error('Failed to update job')
      }
    } catch (e) {
      console.error('Update job failed:', e)
      toast.error(e?.response?.data?.error || 'Failed to update job')
    } finally {
      setSubmitting(false)
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
          <p className="text-gray-600">The job you’re trying to edit doesn’t exist or you don’t have access.</p>
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

  const readOnly = job.status === 'closed' || job.isActive === false

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Job</h1>
        <p className="text-gray-600">Update the job posting details</p>
      </div>

      <JobForm
        mode="edit"
        initialJob={job}
        onSubmit={onSubmit}
        submitting={submitting}
        readOnly={readOnly}
      />
    </div>
  )
}

export default EditJob
