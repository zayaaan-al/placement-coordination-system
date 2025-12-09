import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { jobsAPI } from '../../services/api'
import {
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  StarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'

const JobMatches = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    jobType: '',
    location: '',
    minSalary: '',
    sortBy: 'matchScore'
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchJobs()
  }, [filters])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const params = {
        ...filters,
        status: 'open'
      }
      
      const response = await jobsAPI.getJobs(params)
      if (response.data.success) {
        setJobs(response.data.data.jobs)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast.error('Failed to fetch job matches')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const getMatchScoreColor = (score) => {
    if (score >= 80) return 'text-success-600 bg-success-100'
    if (score >= 60) return 'text-warning-600 bg-warning-100'
    return 'text-gray-600 bg-gray-100'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Opportunities</h1>
          <p className="text-gray-600">Discover jobs that match your skills and interests</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary"
        >
          <FunnelIcon className="h-4 w-4 mr-2" />
          Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Jobs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="form-input"
                placeholder="Job title, company..."
              />
            </div>
            <div>
              <label className="form-label">Job Type</label>
              <select
                value={filters.jobType}
                onChange={(e) => handleFilterChange('jobType', e.target.value)}
                className="form-input"
              >
                <option value="">All Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            <div>
              <label className="form-label">Location</label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="form-input"
                placeholder="City, State..."
              />
            </div>
            <div>
              <label className="form-label">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="form-input"
              >
                <option value="matchScore">Best Match</option>
                <option value="createdAt">Latest</option>
                <option value="deadline">Deadline</option>
                <option value="salary">Salary</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Job Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center">
            <BriefcaseIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Jobs</p>
              <p className="text-2xl font-semibold text-gray-900">{jobs.length}</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center">
            <StarIcon className="h-8 w-8 text-warning-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">High Matches</p>
              <p className="text-2xl font-semibold text-gray-900">
                {jobs.filter(job => job.matchScore >= 80).length}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-danger-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-semibold text-gray-900">
                {jobs.filter(job => getDaysRemaining(job.deadline) <= 7).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <BriefcaseIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-500">
              Try adjusting your filters or check back later for new opportunities.
            </p>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start space-x-4">
                    {/* Company Logo */}
                    <div className="flex-shrink-0">
                      {job.company.logo ? (
                        <img
                          src={job.company.logo}
                          alt={job.company.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-lg">
                            {job.company.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Job Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {job.title}
                        </h3>
                        {job.matchScore && (
                          <span className={`badge ${getMatchScoreColor(job.matchScore)}`}>
                            {Math.round(job.matchScore)}% match
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 font-medium mb-2">{job.company.name}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          {job.location}
                        </div>
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          {formatSalary(job.salary)}
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {getDaysRemaining(job.deadline)} days left
                        </div>
                      </div>

                      <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                        {job.description}
                      </p>

                      {/* Required Skills */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.requiredSkills.slice(0, 4).map((skill, index) => (
                          <span key={index} className="badge badge-primary">
                            {skill.name} ({skill.minLevel}+)
                          </span>
                        ))}
                        {job.requiredSkills.length > 4 && (
                          <span className="badge badge-gray">
                            +{job.requiredSkills.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* Job Meta */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="capitalize">{job.jobType}</span>
                        <span>{job.positions} position{job.positions > 1 ? 's' : ''}</span>
                        <span>Min score: {job.minAggregateScore}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 ml-6">
                  <Link
                    to={`/jobs/${job._id}`}
                    className="btn-primary text-sm"
                  >
                    View Details
                  </Link>
                  
                  {job.hasApplied ? (
                    <span className="badge badge-success text-xs">
                      Applied
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">
                      Not applied
                    </span>
                  )}

                  {getDaysRemaining(job.deadline) <= 7 && (
                    <span className="badge badge-danger text-xs">
                      Expires soon
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default JobMatches
