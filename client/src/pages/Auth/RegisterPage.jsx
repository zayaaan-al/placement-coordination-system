import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import { EyeIcon, EyeSlashIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import AuthNav from '../../components/Auth/AuthNav'
import AuthFooter from '../../components/Auth/AuthFooter'
import { usersAPI, handleAPIError } from '../../services/api'

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [trainers, setTrainers] = useState([])
  const [trainersLoading, setTrainersLoading] = useState(false)
  const { register: registerUser, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') || 'student'

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError
  } = useForm({
    defaultValues: {
      role: defaultRole
    }
  })

  const watchRole = watch('role')
  const watchPassword = watch('password')

  useEffect(() => {
    const fetchApprovedTrainers = async () => {
      try {
        setTrainersLoading(true)
        const response = await usersAPI.getApprovedTrainersPublic()
        if (response.data?.success) {
          setTrainers(response.data.data || [])
        }
      } catch (error) {
        handleAPIError(error, 'Failed to load trainers')
      } finally {
        setTrainersLoading(false)
      }
    }

    fetchApprovedTrainers()
  }, [])

  const onSubmit = async (data) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', { message: 'Passwords do not match' })
      return
    }

    // Remove confirmPassword from data
    let { confirmPassword, ...userData } = data

    // For non-student roles, remove student-only fields so they are not sent as empty strings
    if (userData.role !== 'student') {
      const { batch, trainerId, ...rest } = userData
      userData = rest
    }

    const result = await registerUser(userData)
    if (result.success) {
      navigate('/login')
    } else {
      setError('root', { message: result.error })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col">
      <AuthNav />

      <main className="flex-1 flex items-center justify-center py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
            <AcademicCapIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Join PlacementPro
          </h2>
          <p className="text-base sm:text-lg text-gray-600">
            Create your account to get started
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {errors.root && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {errors.root.message}
              </div>
            )}

            <div className="space-y-4 sm:space-y-6">
              {/* Role Selection */}
              <div>
                <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
                  I am a
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'student', label: 'Student', icon: '\ud83c\udf93' },
                    { value: 'trainer', label: 'Trainer', icon: '\ud83d\udc68\u200d\ud83c\udfeb' },
                  ].map((role) => (
                    <label key={role.value} className="relative">
                      <input
                        {...register('role', { required: 'Role is required' })}
                        type="radio"
                        value={role.value}
                        className="sr-only peer"
                      />
                      <div className="flex flex-col items-center p-3 sm:p-4 border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:border-gray-300 hover:bg-gray-50">
                        <span className="text-2xl mb-1">{role.icon}</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-700 peer-checked:text-blue-700">{role.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.role && (
                  <p className="text-sm text-red-600 mt-2">{errors.role.message}</p>
                )}
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    {...register('name.first', {
                      required: 'First name is required',
                      minLength: {
                        value: 2,
                        message: 'First name must be at least 2 characters'
                      }
                    })}
                    type="text"
                    className="block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                    placeholder="Enter your first name"
                  />
                  {errors.name?.first && (
                    <p className="text-sm text-red-600 mt-2">{errors.name.first.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    {...register('name.last', {
                      required: 'Last name is required',
                      minLength: {
                        value: 1,
                        message: 'Last name must be at least 1 character'
                      }
                    })}
                    type="text"
                    className="block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                    placeholder="Enter your last name"
                  />
                  {errors.name?.last && (
                    <p className="text-sm text-red-600 mt-2">{errors.name.last.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  autoComplete="email"
                  className="block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-2">{errors.email.message}</p>
                )}
              </div>

              {/* Student-specific fields */}
              {watchRole === 'student' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="program" className="block text-sm font-semibold text-gray-700 mb-2">
                        Program
                      </label>
                      <select
                        {...register('program', {
                          required: 'Program is required'
                        })}
                        className="block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base bg-white"
                      >
                        <option value="">Select Program</option>
                        <option value="MERN Stack Development">MERN Stack Development</option>
                        <option value="Python Full Stack Development">Python Full Stack Development</option>
                        <option value="Digital Marketing">Digital Marketing</option>
                        <option value="Flutter Development">Flutter Development</option>
                        <option value="Data Analytics">Data Analytics</option>
                        <option value="Data Science">Data Science</option>
                        <option value="UI/UX Designing">UI/UX Designing</option>
                      </select>
                      {errors.program && (
                        <p className="text-sm text-red-600 mt-2">{errors.program.message}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="batch" className="block text-sm font-semibold text-gray-700 mb-2">
                        Batch
                      </label>
                      <select
                        {...register('batch', {
                          required: 'Batch is required'
                        })}
                        className="block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base bg-white"
                      >
                        <option value="">Select Batch (Month)</option>
                        <option value="January">January</option>
                        <option value="February">February</option>
                        <option value="March">March</option>
                        <option value="April">April</option>
                        <option value="May">May</option>
                        <option value="June">June</option>
                        <option value="July">July</option>
                        <option value="August">August</option>
                        <option value="September">September</option>
                        <option value="October">October</option>
                        <option value="November">November</option>
                        <option value="December">December</option>
                      </select>
                      {errors.batch && (
                        <p className="text-sm text-red-600 mt-2">{errors.batch.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="trainerId" className="block text-sm font-semibold text-gray-700 mb-2">
                      Trainer
                    </label>
                    <select
                      {...register('trainerId', {
                        required: 'Trainer is required'
                      })}
                      className="block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base bg-white"
                      disabled={trainersLoading || trainers.length === 0}
                    >
                      <option value="">{trainersLoading ? 'Loading trainers...' : 'Select Trainer'}</option>
                      {trainers.map(trainer => (
                        <option key={trainer._id} value={trainer._id}>
                          {trainer.name?.first} {trainer.name?.last}
                        </option>
                      ))}
                    </select>
                    {errors.trainerId && (
                      <p className="text-sm text-red-600 mt-2">{errors.trainerId.message}</p>
                    )}
                  </div>
                </>
              )}

              {/* Trainer-specific fields */}
              {watchRole === 'trainer' && (
                <>
                  <div>
                    <label htmlFor="trainerProgram" className="block text-sm font-semibold text-gray-700 mb-2">
                      Program
                    </label>
                    <select
                      {...register('program', {
                        required: 'Program is required'
                      })}
                      className="block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base bg-white"
                    >
                      <option value="">Select Program</option>
                      <option value="MERN Stack Development">MERN Stack Development</option>
                      <option value="Python Full Stack Development">Python Full Stack Development</option>
                      <option value="Digital Marketing">Digital Marketing</option>
                      <option value="Flutter Development">Flutter Development</option>
                      <option value="Data Analytics">Data Analytics</option>
                      <option value="Data Science">Data Science</option>
                      <option value="UI/UX Designing">UI/UX Designing</option>
                    </select>
                    {errors.program && (
                      <p className="text-sm text-red-600 mt-2">{errors.program.message}</p>
                    )}
                  </div>
                </>
              )}

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  {...register('profile.phone')}
                  type="tel"
                  className="block w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="block w-full px-3 py-2 sm:px-4 sm:py-3 pr-10 sm:pr-12 border border-gray-300 rounded-lg sm:rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
                {errors.password && (
                  <p className="text-sm text-red-600 mt-2">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value =>
                        value === watchPassword || 'Passwords do not match'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="block w-full px-3 py-2 sm:px-4 sm:py-3 pr-10 sm:pr-12 border border-gray-300 rounded-lg sm:rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 mt-2">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 sm:py-4 px-4 border border-transparent text-base sm:text-lg font-semibold rounded-lg sm:rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              {loading ? (
                <div className="flex items-center">
                  <LoadingSpinner size="small" className="mr-2" />
                  Creating Account...
                </div>
              ) : (
                <span className="flex items-center">
                  <span>Create Account</span>
                  <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>

            {/* Terms and Privacy */}
            <div className="text-center">
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                By creating an account, you agree to our{' '}
                <Link to="/terms" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Privacy Policy
                </Link>
              </p>
            </div>

          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
        </div>
      </main>

      <AuthFooter />
    </div>
  )
}

export default RegisterPage
