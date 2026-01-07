import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { usersAPI } from '../../services/api'
import { useForm } from 'react-hook-form'
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
  AcademicCapIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

const StudentProfile = () => {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editingSkills, setEditingSkills] = useState(false)
  const [activeTab, setActiveTab] = useState('overview') // single Overview tab
  const [selectedMonth, setSelectedMonth] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm()

  const {
    register: registerSkill,
    handleSubmit: handleSkillSubmit,
    reset: resetSkill,
    formState: { errors: skillErrors }
  } = useForm()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await usersAPI.getProfile()
      if (response.data.success) {
        setProfile(response.data.data)
        reset({
          name: response.data.data.name,
          profile: response.data.data.profile,
          ...(response.data.data.studentProfile && {
            program: response.data.data.studentProfile.program,
            batch: response.data.data.studentProfile.batch
          })
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (data) => {
    try {
      const response = await usersAPI.updateProfile(data)
      if (response.data.success) {
        setProfile(prev => ({ ...prev, ...response.data.data }))
        updateUser(response.data.data)
        setEditing(false)
        toast.success('Profile updated successfully')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    }
  }

  const updateStudentProfile = async (data) => {
    try {
      const response = await usersAPI.updateStudentProfile(data)
      if (response.data.success) {
        setProfile(prev => ({ ...prev, studentProfile: response.data.data }))
        toast.success('Student profile updated successfully')
      }
    } catch (error) {
      console.error('Error updating student profile:', error)
      toast.error('Failed to update student profile')
    }
  }

  const addSkill = async (data) => {
    try {
      const currentSkills = profile?.studentProfile?.skills || []
      const newSkills = [...currentSkills, { ...data, lastUpdated: new Date() }]
      
      await updateStudentProfile({ skills: newSkills })
      setProfile(prev => ({
        ...prev,
        studentProfile: {
          ...prev.studentProfile,
          skills: newSkills
        }
      }))
      resetSkill()
      setEditingSkills(false)
      toast.success('Skill added successfully')
    } catch (error) {
      console.error('Error adding skill:', error)
      toast.error('Failed to add skill')
    }
  }

  const removeSkill = async (index) => {
    try {
      const currentSkills = profile?.studentProfile?.skills || []
      const newSkills = currentSkills.filter((_, i) => i !== index)
      
      await updateStudentProfile({ skills: newSkills })
      setProfile(prev => ({
        ...prev,
        studentProfile: {
          ...prev.studentProfile,
          skills: newSkills
        }
      }))
      toast.success('Skill removed successfully')
    } catch (error) {
      console.error('Error removing skill:', error)
      toast.error('Failed to remove skill')
    }
  }

  const studentProfile = profile?.studentProfile || null
  const tests = studentProfile?.tests || []

  // Derived metrics based on existing studentProfile/tests data
  const overallPerformance = typeof studentProfile?.aggregateScore === 'number'
    ? Math.round(studentProfile.aggregateScore)
    : tests.length
      ? Math.round(
          (tests.reduce((sum, t) => sum + (t.score / t.maxScore) * 100, 0) / tests.length) || 0
        )
      : 0

  const totalEvaluations = tests.length
  const lastEvaluationDate = tests.length
    ? new Date(
        tests
          .map(t => new Date(t.date || t.recordedDate || t.createdAt || 0))
          .filter(d => !isNaN(d))
          .sort((a, b) => b - a)[0]
      )
    : null

  const strongestSkill = (studentProfile?.skills || []).reduce(
    (best, skill) => {
      if (typeof skill.level !== 'number') return best
      if (!best || skill.level > best.level) return skill
      return best
    },
    null
  )

  const approvalStatus = studentProfile?.approvalStatus || profile?.approvalStatus
  const approvalLabel = approvalStatus
    ? approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1)
    : 'Not set'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-2xl px-5 py-5 sm:px-6 sm:py-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-white/10 flex items-center justify-center ring-2 ring-white/40 shadow-inner">
              {studentProfile ? (
                <AcademicCapIcon className="h-8 w-8 text-white" />
              ) : (
                <UserCircleIcon className="h-8 w-8 text-white" />
              )}
            </div>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {profile?.name?.first} {profile?.name?.last}
            </h1>
            <p className="text-sm text-indigo-100 flex flex-wrap items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs uppercase tracking-wide">
                {studentProfile?.program || 'Program not set'}
              </span>
              {studentProfile?.batch && (
                <span className="text-xs">Batch {studentProfile.batch}</span>
              )}
            </p>
            {studentProfile?.rollNo && (
              <p className="text-xs sm:text-sm text-indigo-100 mt-1">
                Roll No: <span className="font-semibold text-white">{studentProfile.rollNo}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium bg-white/90 text-gray-800 shadow-sm">
            <CheckBadgeIcon className="h-4 w-4 text-emerald-500" />
            <span className="uppercase tracking-wide">{approvalLabel}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-indigo-100">
            <div className="inline-flex items-center gap-1">
              <CalendarDaysIcon className="h-4 w-4" />
              <span>
                Last evaluated:{' '}
                {lastEvaluationDate
                  ? lastEvaluationDate.toLocaleDateString()
                  : 'No evaluations yet'}
              </span>
            </div>
            <div className="inline-flex items-center gap-1">
              <ChartBarIcon className="h-4 w-4" />
              <span>
                Overall performance: <span className="font-semibold text-white">{overallPerformance}%</span>
              </span>
            </div>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="mt-1 inline-flex items-center rounded-full bg-white/95 text-primary-700 px-4 py-1.5 text-xs sm:text-sm font-semibold shadow hover:bg-white transition"
          >
            <PencilIcon className="h-4 w-4 mr-1.5" />
            {editing ? 'Cancel editing' : 'Edit profile'}
          </button>
        </div>
      </div>

      {/* Key metrics cards */}
      {/* Score cards removed per latest requirements */}

      {/* Tabs (only Overview now) */}
      <div className="border-b border-gray-200 mt-2">
        <nav className="flex flex-wrap gap-2" aria-label="Tabs">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-t-lg border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-700 bg-primary-50'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'
            }`}
          >
            Overview
          </button>
        </nav>
      </div>

      {/* Tab content: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="card bg-white/90 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Basic Information</h3>
            <p className="text-xs text-gray-500 mb-4">Your personal details and contact information.</p>

            {editing ? (
              <form onSubmit={handleSubmit(updateProfile)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">First Name</label>
                    <input
                      {...register('name.first', { required: 'First name is required' })}
                      className="form-input"
                    />
                    {errors.name?.first && (
                      <p className="form-error">{errors.name.first.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="form-label">Last Name</label>
                    <input
                      {...register('name.last', { required: 'Last name is required' })}
                      className="form-input"
                    />
                    {errors.name?.last && (
                      <p className="form-error">{errors.name.last.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="form-label">Phone</label>
                  <input
                    {...register('profile.phone')}
                    className="form-input"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="form-label">Bio</label>
                  <textarea
                    {...register('profile.bio')}
                    className="form-input"
                    rows={3}
                    placeholder="Tell us about yourself"
                  />
                </div>

                <div className="flex space-x-3">
                  <button type="submit" className="btn-primary">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name</label>
                    <p className="mt-1 text-gray-900 font-medium">{profile?.name?.first} {profile?.name?.last}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                    <p className="mt-1 text-gray-900 break-all">{profile?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                    <p className="mt-1 text-gray-900">{profile?.profile?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Role</label>
                    <p className="mt-1 text-gray-900 capitalize">{profile?.role}</p>
                  </div>
                </div>
                {profile?.profile?.bio && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bio</label>
                    <p className="mt-1 text-gray-900 leading-relaxed">{profile.profile.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Academic Information */}
          {studentProfile && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Roll Number</label>
                  <p className="text-gray-900">{studentProfile.rollNo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Program</label>
                  <p className="text-gray-900">{studentProfile.program}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Batch</label>
                  <p className="text-gray-900">{studentProfile.batch}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Aggregate Score</label>
                  <p className="text-2xl font-bold text-primary-600">
                    {studentProfile.aggregateScore}%
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Placement Status</label>
                  <span className={`badge ${
                    studentProfile.placementStatus === 'approved' ? 'badge-success' :
                    studentProfile.placementStatus === 'placed' ? 'badge-primary' :
                    studentProfile.placementStatus === 'shortlisted' ? 'badge-warning' :
                    'badge-gray'
                  }`}>
                    {studentProfile.placementStatus.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Placement Eligible</label>
                  <span className={`badge ${
                    studentProfile.placementEligible ? 'badge-success' : 'badge-danger'
                  }`}>
                    {studentProfile.placementEligible ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Skills */}
          {studentProfile && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Skills</h3>
                <button
                  onClick={() => setEditingSkills(!editingSkills)}
                  className="btn-secondary text-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Skill
                </button>
              </div>

              {editingSkills && (
                <form onSubmit={handleSkillSubmit(addSkill)} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">Skill Name</label>
                      <input
                        {...registerSkill('name', { required: 'Skill name is required' })}
                        className="form-input"
                        placeholder="e.g., JavaScript"
                      />
                      {skillErrors.name && (
                        <p className="form-error">{skillErrors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="form-label">Level (0-100)</label>
                      <input
                        {...registerSkill('level', { 
                          required: 'Level is required',
                          min: { value: 0, message: 'Level must be at least 0' },
                          max: { value: 100, message: 'Level cannot exceed 100' }
                        })}
                        type="number"
                        min="0"
                        max="100"
                        className="form-input"
                        placeholder="85"
                      />
                      {skillErrors.level && (
                        <p className="form-error">{skillErrors.level.message}</p>
                      )}
                    </div>
                    <div className="flex items-end space-x-2">
                      <button type="submit" className="btn-primary">
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSkills(false)
                          resetSkill()
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studentProfile.skills?.map((skill, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{skill.name}</h4>
                      <button
                        onClick={() => removeSkill(index)}
                        className="text-gray-400 hover:text-danger-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Level</span>
                        <span>{skill.level}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                    </div>
                    {skill.tags && skill.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {skill.tags.map((tag, tagIndex) => (
                          <span key={tagIndex} className="badge badge-gray text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )) || (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <p>No skills added yet</p>
                    <button
                      onClick={() => setEditingSkills(true)}
                      className="text-primary-600 hover:text-primary-500 text-sm"
                    >
                      Add your first skill
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test Results */}
          {tests.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Test Results</h3>
              <div className="space-y-4">
                {tests.map((test, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{test.title || test.type || `Evaluation ${index + 1}`}</h4>
                      <span className="text-sm text-gray-500">
                        {new Date(test.date || test.recordedDate || test.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div>
                        <span className="text-2xl font-bold text-primary-600">
                          {test.score}
                        </span>
                        <span className="text-gray-500">/{test.maxScore}</span>
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${(test.score / test.maxScore) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {Math.round((test.score / test.maxScore) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
