import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import { EyeIcon, EyeSlashIcon, AcademicCapIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import AuthNav from '../../components/Auth/AuthNav'
import AuthFooter from '../../components/Auth/AuthFooter'

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm()

  const onSubmit = async (data) => {
    const result = await login(data)
    if (result.success) {
      navigate(from, { replace: true })
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
            Welcome Back
          </h2>
          <p className="text-base sm:text-lg text-gray-600">
            Sign in to your PlacementPro account
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8">
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {errors.root && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {errors.root.message}
              </div>
            )}

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email address
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
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-2">{errors.email.message}</p>
                )}
              </div>

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
                    autoComplete="current-password"
                    className="block w-full px-3 py-2 sm:px-4 sm:py-3 pr-10 sm:pr-12 border border-gray-300 rounded-lg sm:rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600 mt-2">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent text-sm sm:text-base font-medium rounded-lg sm:rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center">
                  <LoadingSpinner size="small" className="mr-2" />
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Create one here
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

export default LoginPage
