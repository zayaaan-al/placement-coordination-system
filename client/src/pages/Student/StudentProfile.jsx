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

// Helper functions (need to be defined before components)
const getScoreColor = (score) => {
  if (score === null) return '#9CA3AF'
  if (score < 40) return '#EF4444' // red
  if (score < 70) return '#F59E0B' // yellow
  return '#10B981' // green
}

const AggregateRing = ({ value = 0, size = 96, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference - (clamped / 100) * circumference

  return (
    <svg
      width={size}
      height={size}
      className="transform -rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <defs>
        <linearGradient id="aggGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#aggGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
        fill="none"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-gray-900 text-sm font-semibold rotate-90"
      >
        {clamped}%
      </text>
    </svg>
  )
}

const PerformanceRing = ({ value = null, size = 120, strokeWidth = 12, trend = null }) => {
  const [animatedValue, setAnimatedValue] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = value !== null ? Math.max(0, Math.min(100, value)) : 0
  const offset = circumference - (clamped / 100) * circumference
  const color = getScoreColor(value)

  // Animate on mount and value change
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(clamped)
    }, 100)
    return () => clearTimeout(timer)
  }, [clamped])

  const TrendIcon = () => {
    if (trend === 'up') return <span className="text-green-500 text-lg">↑</span>
    if (trend === 'down') return <span className="text-red-500 text-lg">↓</span>
    if (trend === 'stable') return <span className="text-gray-500 text-lg">→</span>
    return null
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 transition-all duration-1000 ease-out"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (animatedValue / 100) * circumference}
          className="transition-all duration-1000 ease-out hover:opacity-80"
          fill="none"
          style={{
            filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.1))'
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold" style={{ color }}>
          {value !== null ? `${value}%` : 'N/A'}
        </div>
        <TrendIcon />
      </div>
    </div>
  )
}

const StatusPill = ({ icon: Icon, label, tone = 'neutral' }) => {
  const tones = {
    success: 'from-emerald-500/10 to-emerald-600/10 text-emerald-700 border-emerald-200',
    warning: 'from-amber-500/10 to-amber-600/10 text-amber-700 border-amber-200',
    danger: 'from-rose-500/10 to-rose-600/10 text-rose-700 border-rose-200',
    neutral: 'from-gray-500/10 to-gray-600/10 text-gray-700 border-gray-200'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium bg-gradient-to-r ${tones[tone]}`}>
      {Icon && <Icon className="h-3.5 w-3.5" />}
      <span className="uppercase tracking-wide">{label}</span>
    </span>
  )
}

const StudentProfile = () => {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editingSkills, setEditingSkills] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
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
      console.log('Updating profile with data:', data)
      // Separate basic profile fields from student-specific fields
      const { program, batch, ...basicProfileData } = data
      console.log('Basic profile data:', basicProfileData)
      console.log('Student profile data:', { program, batch })
      
      // Update basic profile
      const response = await usersAPI.updateProfile(basicProfileData)
      console.log('Update response:', response.data)
      if (response.data.success) {
        // Update local state
        setProfile(prev => ({ ...prev, ...response.data.data }))
        // Update auth context
        updateUser(response.data.data)
        
        // Update student-specific fields if provided
        if (program || batch) {
          const studentData = {}
          if (program) studentData.program = program
          if (batch) studentData.batch = batch
          await updateStudentProfile(studentData)
        }
        
        // Refetch to ensure latest data
        await fetchProfile()
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
      console.log('Updating student profile with data:', data)
      const response = await usersAPI.updateStudentProfile(data)
      console.log('Student profile update response:', response.data)
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
      // Only send fields required by server schema
      const newSkill = {
        name: data.name.trim(),
        level: Number(data.level),
        ...(data.tags && { tags: data.tags.map(t => t.trim()).filter(Boolean) })
      }
      // Strip server-added fields from existing skills before sending
      const cleanCurrentSkills = currentSkills.map(skill => ({
        name: skill.name,
        level: skill.level,
        ...(skill.tags && skill.tags.length > 0 && { tags: skill.tags })
      }))
      const newSkills = [...cleanCurrentSkills, newSkill]
      console.log('Adding skill. New skills array:', JSON.stringify(newSkills, null, 2))
      
      await updateStudentProfile({ skills: newSkills })
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
      const filteredSkills = currentSkills.filter((_, i) => i !== index)
      // Strip server-added fields before sending
      const newSkills = filteredSkills.map(skill => ({
        name: skill.name,
        level: skill.level,
        ...(skill.tags && skill.tags.length > 0 && { tags: skill.tags })
      }))
      console.log('Removing skill. New skills array:', JSON.stringify(newSkills, null, 2))
      
      await updateStudentProfile({ skills: newSkills })
      toast.success('Skill removed successfully')
    } catch (error) {
      console.error('Error removing skill:', error)
      toast.error('Failed to remove skill')
    }
  }

  const studentProfile = profile?.studentProfile || null
  const tests = studentProfile?.tests || []

  // Derived metrics based on existing studentProfile/tests data
  const overallPerformance = tests.length
    ? Math.round(
        (tests.reduce((sum, t) => sum + (t.score / t.maxScore) * 100, 0) / tests.length) || 0
      )
      : typeof studentProfile?.aggregateScore === 'number'
        ? Math.round(studentProfile.aggregateScore)
        : null

  const totalEvaluations = tests.length
  const lastEvaluationDate = tests.length
    ? new Date(
        tests
          .map(t => new Date(t.date || t.recordedDate || t.createdAt || 0))
          .filter(d => !isNaN(d))
          .sort((a, b) => b - a)[0]
      )
    : null

  // Get latest performance month
  const latestPerformanceMonth = lastEvaluationDate
    ? lastEvaluationDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'No evaluations yet'

  // Calculate trend (current month vs previous month)
  const getPerformanceTrend = () => {
    if (!lastEvaluationDate || tests.length < 2) return null
    
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()
    
    const currentMonthTests = tests.filter(t => {
      const testDate = new Date(t.date || t.recordedDate || t.createdAt)
      return testDate.getMonth() === currentMonth && testDate.getFullYear() === currentYear
    })
    
    const previousMonthTests = tests.filter(t => {
      const testDate = new Date(t.date || t.recordedDate || t.createdAt)
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
      return testDate.getMonth() === prevMonth && testDate.getFullYear() === prevYear
    })
    
    if (currentMonthTests.length === 0 || previousMonthTests.length === 0) return null
    
    const currentAvg = currentMonthTests.reduce((sum, t) => sum + (t.score / t.maxScore) * 100, 0) / currentMonthTests.length
    const previousAvg = previousMonthTests.reduce((sum, t) => sum + (t.score / t.maxScore) * 100, 0) / previousMonthTests.length
    
    if (currentAvg > previousAvg) return 'up'
    if (currentAvg < previousAvg) return 'down'
    return 'stable'
  }

  const trend = getPerformanceTrend()

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

  const placementStatus = studentProfile?.placementStatus
  const placementEligible = studentProfile?.placementEligible

  const approvalTone = approvalStatus === 'approved'
    ? 'success'
    : approvalStatus === 'pending'
      ? 'warning'
      : approvalStatus === 'rejected'
        ? 'danger'
        : 'neutral'

  const placementTone = placementStatus === 'approved' || placementStatus === 'placed'
    ? 'success'
    : placementStatus === 'shortlisted'
      ? 'warning'
      : placementStatus
        ? 'neutral'
        : 'neutral'

  const eligibleTone = placementEligible == null
    ? 'neutral'
    : placementEligible
      ? 'success'
      : 'danger'

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
          <StatusPill
            icon={CheckBadgeIcon}
            label={approvalLabel}
            tone={approvalTone}
          />
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
          <div className="card bg-white/90 border border-gray-200 shadow-sm transition-transform transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Basic Information</h3>
            <p className="text-xs text-gray-500 mb-4">Your personal details and contact information.</p>

            {editing ? (
              <form onSubmit={handleSubmit(updateProfile)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      {...register('name.first', { required: 'First name is required' })}
                      className="peer w-full rounded-xl border border-gray-300 bg-white px-3 pt-5 pb-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                      placeholder=" "
                    />
                    <label
                      className="pointer-events-none absolute left-3 top-3.5 text-sm text-gray-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-primary-600"
                    >
                      First Name
                    </label>
                    {errors.name?.first && (
                      <p className="mt-1 text-xs text-rose-500">{errors.name.first.message}</p>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      {...register('name.last', { required: 'Last name is required' })}
                      className="peer w-full rounded-xl border border-gray-300 bg-white px-3 pt-5 pb-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                      placeholder=" "
                    />
                    <label
                      className="pointer-events-none absolute left-3 top-3.5 text-sm text-gray-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-primary-600"
                    >
                      Last Name
                    </label>
                    {errors.name?.last && (
                      <p className="mt-1 text-xs text-rose-500">{errors.name.last.message}</p>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <input
                    {...register('profile.phone')}
                    className="peer w-full rounded-xl border border-gray-300 bg-white px-3 pt-5 pb-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                    placeholder=" "
                  />
                  <label
                    className="pointer-events-none absolute left-3 top-3.5 text-sm text-gray-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-primary-600"
                  >
                    Phone
                  </label>
                </div>

                <div className="relative">
                  <textarea
                    {...register('profile.bio')}
                    className="peer w-full rounded-xl border border-gray-300 bg-white px-3 pt-5 pb-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 min-h-[96px] resize-y"
                    placeholder=" "
                  />
                  <label
                    className="pointer-events-none absolute left-3 top-3.5 text-sm text-gray-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-primary-600"
                  >
                    Bio
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-indigo-500 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col items-start md:items-stretch">
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
            <div className="card bg-white/90 border border-gray-200 shadow-sm transition-transform transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-md px-4 sm:px-5 py-4 sm:py-5">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Placement Status</label>
                  <div className="mt-1">
                    <StatusPill
                      label={placementStatus ? placementStatus.replace('_', ' ') : 'Not set'}
                      tone={placementTone}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Placement Eligible</label>
                  <div className="mt-1">
                    <StatusPill
                      label={placementEligible == null ? 'Not set' : placementEligible ? 'Yes' : 'No'}
                      tone={eligibleTone}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Skills */}
          {studentProfile && (
            <div className="card bg-white/90 border border-gray-200 shadow-sm transition-transform transition-shadow duration-200 hover:-translate-y-0.5 hover:shadow-md px-4 sm:px-5 py-4 sm:py-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Skills</h3>
                  <p className="mt-1 text-xs text-gray-500">Track and manage your key technical abilities.</p>
                </div>
                <button
                  onClick={() => setEditingSkills(!editingSkills)}
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-primary-500 to-indigo-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Skill
                </button>
              </div>

              {editingSkills && (
                <form onSubmit={handleSkillSubmit(addSkill)} className="mb-6 p-4 bg-gray-50 rounded-xl border border-dashed border-primary-100">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <input
                        {...registerSkill('name', { required: 'Skill name is required' })}
                        className="peer w-full rounded-xl border border-gray-300 bg-white px-3 pt-5 pb-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                        placeholder=" "
                      />
                      <label className="pointer-events-none absolute left-3 top-3.5 text-sm text-gray-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-primary-600">
                        Skill Name
                      </label>
                      {skillErrors.name && (
                        <p className="mt-1 text-xs text-rose-500">{skillErrors.name.message}</p>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        {...registerSkill('level', { 
                          required: 'Level is required',
                          min: { value: 0, message: 'Level must be at least 0' },
                          max: { value: 100, message: 'Level cannot exceed 100' }
                        })}
                        type="number"
                        min="0"
                        max="100"
                        className="peer w-full rounded-xl border border-gray-300 bg-white px-3 pt-5 pb-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400"
                        placeholder=" "
                      />
                      <label className="pointer-events-none absolute left-3 top-3.5 text-sm text-gray-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-primary-600">
                        Level (0-100)
                      </label>
                      {skillErrors.level && (
                        <p className="mt-1 text-xs text-rose-500">{skillErrors.level.message}</p>
                      )}
                    </div>
                    <div className="flex items-end gap-2 justify-start md:justify-end">
                      <button type="submit" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-indigo-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:opacity-60 disabled:cursor-not-allowed">
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSkills(false)
                          resetSkill()
                        }}
                        className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
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
