import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { jobsAPI } from '../../services/api'
import {
  ArrowLeftIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'

const JobDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    fetchJobDetails()
  }, [id])

  const fetchJobDetails = async () => {
    try {
      const response = await jobsAPI.getJobById(id)
      if (response.data.success) {
        setJob(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching job details:', error)
      toast.error('Failed to fetch job details')
      navigate('/jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    try {
      setApplying(true)
      const response = await jobsAPI.applyForJob(id)
      if (response.data.success) {
        setJob(prev => ({ ...prev, hasApplied: true }))
        toast.success('Application submitted successfully!')
      }
    } catch (error) {
      console.error('Error applying for job:', error)
      const errorMessage = error.response?.data?.error || 'Failed to apply for job'
      toast.error(errorMessage)
    } finally {
      setApplying(false)
    }
  }

  const formatSalary = (salary) => {
    if (!salary) return 'Not specified'
    const { min, max, currency = 'USD' } = salary
    if (min && max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`
    } else if (min) {
      return `${currency} ${min.toLocaleString()}+`
    }
    return 'Not specified'
  }

  const getDaysRemaining = (deadline) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-success-600 bg-success-100'
    if (score >= 60) return 'text-warning-600 bg-warning-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getSkillMatchStatus = (skill, studentSkills = []) => {
    const studentSkill = studentSkills.find(s => 
      s.name.toLowerCase() === skill.name.toLowerCase()
    )
    
    if (!studentSkill) {
      return { status: 'missing', color: 'text-danger-600', icon: XCircleIcon }
    }
    
    if (studentSkill.level >= skill.minLevel) {
      return { status: 'meets', color: 'text-success-600', icon: CheckCircleIcon }
    }
    
    return { status: 'below', color: 'text-warning-600', icon: XCircleIcon }
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
        <button onClick={() => navigate('/jobs')} className="btn-primary">
          Back to Jobs
        </button>
      </div>
    )
  }

  const daysRemaining = getDaysRemaining(job.deadline)
  const isExpired = daysRemaining === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/jobs')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
          <p className="text-gray-600">{job.company.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Overview */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                {job.company.logo ? (
                  <img
                    src={job.company.logo}
                    alt={job.company.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-xl">
                      {job.company.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
                  <p className="text-gray-600 font-medium">{job.company.name}</p>
                  {job.company.website && (
                    <a
                      href={job.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-500 text-sm"
                    >
                      Visit website
                    </a>
                  )}
                </div>
              </div>
              
              {job.matchScore && (
                <div className="text-right">
                  <span className={`badge ${getMatchScoreColor(job.matchScore)} text-lg px-3 py-1`}>
                    {Math.round(job.matchScore)}% match
                  </span>
                  <p className="text-xs text-gray-500 mt-1">Your compatibility</p>
                </div>
              )}
            </div>

            {/* Job Meta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <MapPinIcon className="h-4 w-4 mr-2" />
                {job.location}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                {formatSalary(job.salary)}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <UserGroupIcon className="h-4 w-4 mr-2" />
                {job.positions} position{job.positions > 1 ? 's' : ''}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <ClockIcon className="h-4 w-4 mr-2" />
                {daysRemaining} days left
              </div>
            </div>

            {/* Job Description */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Job Description</h3>
              <div className="prose prose-sm max-w-none text-gray-700">
                {job.description.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-3">{paragraph}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Required Skills */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Required Skills</h3>
            <div className="space-y-3">
              {job.requiredSkills.map((skill, index) => {
                const matchStatus = getSkillMatchStatus(skill, job.matchExplanation?.explanation?.skillScore?.details?.matched)
                const Icon = matchStatus.icon
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-5 w-5 ${matchStatus.color}`} />
                      <div>
                        <span className="font-medium text-gray-900">{skill.name}</span>
                        <p className="text-sm text-gray-500">
                          Minimum level: {skill.minLevel}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${
                        matchStatus.status === 'meets' ? 'badge-success' :
                        matchStatus.status === 'below' ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                        {matchStatus.status === 'meets' ? 'Qualified' :
                         matchStatus.status === 'below' ? 'Below level' :
                         'Missing'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Match Explanation */}
          {job.matchExplanation && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Why You're a Match</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-primary-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600">
                      {Math.round(job.matchExplanation.explanation.skillScore.score)}%
                    </div>
                    <div className="text-sm text-gray-600">Skills Match</div>
                  </div>
                  <div className="text-center p-4 bg-success-50 rounded-lg">
                    <div className="text-2xl font-bold text-success-600">
                      {Math.round(job.matchExplanation.explanation.testScore.score)}%
                    </div>
                    <div className="text-sm text-gray-600">Test Performance</div>
                  </div>
                  <div className="text-center p-4 bg-warning-50 rounded-lg">
                    <div className="text-2xl font-bold text-warning-600">
                      {Math.round(job.matchExplanation.explanation.trainerScore.score)}%
                    </div>
                    <div className="text-sm text-gray-600">Trainer Rating</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application Status */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Application</h3>
            
            {isExpired ? (
              <div className="text-center py-4">
                <XCircleIcon className="h-12 w-12 text-danger-500 mx-auto mb-2" />
                <p className="text-danger-600 font-medium">Application Deadline Passed</p>
                <p className="text-sm text-gray-500">This job is no longer accepting applications</p>
              </div>
            ) : job.hasApplied ? (
              <div className="text-center py-4">
                <CheckCircleIcon className="h-12 w-12 text-success-500 mx-auto mb-2" />
                <p className="text-success-600 font-medium">Application Submitted</p>
                <p className="text-sm text-gray-500">You have already applied for this position</p>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="btn-primary w-full"
                >
                  {applying ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="small" className="mr-2" />
                      Applying...
                    </div>
                  ) : (
                    'Apply Now'
                  )}
                </button>
                
                {daysRemaining <= 7 && (
                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-warning-600 mr-2" />
                      <span className="text-warning-800 text-sm font-medium">
                        Deadline approaching: {daysRemaining} days left
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Job Details */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Job Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Job Type</label>
                <p className="text-gray-900 capitalize">{job.jobType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Experience Level</label>
                <p className="text-gray-900">
                  {job.experience?.min || 0} - {job.experience?.max || 'Any'} years
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Minimum Score Required</label>
                <p className="text-gray-900">{job.minAggregateScore}%</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Application Deadline</label>
                <p className="text-gray-900">{new Date(job.deadline).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Posted On</label>
                <p className="text-gray-900">{new Date(job.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Eligibility */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Eligibility</h3>
            <div className="space-y-3">
              {job.eligibleBatches && job.eligibleBatches.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Eligible Batches</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.eligibleBatches.map((batch, index) => (
                      <span key={index} className="badge badge-primary">
                        {batch}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {job.eligiblePrograms && job.eligiblePrograms.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Eligible Programs</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {job.eligiblePrograms.map((program, index) => (
                      <span key={index} className="badge badge-secondary">
                        {program}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobDetails
