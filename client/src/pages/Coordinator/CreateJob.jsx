import React from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { jobsAPI } from '../../services/api'
import JobForm from './components/JobForm'

const CreateJob = () => {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = React.useState(false)

  const onSubmit = async (payload) => {
    try {
      setSubmitting(true)
      const res = await jobsAPI.createJob(payload)
      if (res?.data?.success) {
        const created = res.data.data
        toast.success('Job created')
        navigate(`/dashboard/job-management/${created?._id || ''}`)
      } else {
        toast.error('Failed to create job')
      }
    } catch (e) {
      console.error('Create job failed:', e)
      const details = e?.response?.data?.details
      if (Array.isArray(details) && details.length > 0) {
        toast.error(details[0])
      } else {
        toast.error(e?.response?.data?.error || 'Failed to create job')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Job</h1>
        <p className="text-gray-600">Create a new job posting</p>
      </div>

      <JobForm
        mode="create"
        initialJob={null}
        onSubmit={onSubmit}
        submitting={submitting}
        readOnly={false}
      />
    </div>
  )
}

export default CreateJob
