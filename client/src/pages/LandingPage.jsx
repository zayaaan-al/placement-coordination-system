import React from 'react'
import { Link } from 'react-router-dom'
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  TrophyIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

const LandingPage = () => {
  const features = [
    {
      icon: AcademicCapIcon,
      title: 'Smart Performance Tracking',
      description: 'Advanced analytics and real-time insights into student progress, skills development, and achievement milestones.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: UserGroupIcon,
      title: 'Seamless Collaboration',
      description: 'Unified platform connecting students, trainers, and coordinators with role-based access and workflows.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: RocketLaunchIcon,
      title: 'AI-Powered Matching',
      description: 'Intelligent job-student matching algorithm that considers skills, preferences, and performance metrics.',
      gradient: 'from-green-500 to-emerald-500'
    }
  ]

  const benefits = [
    'Real-time performance tracking and analytics',
    'Automated job-student matching algorithm',
    'Comprehensive evaluation and feedback system',
    'Role-based dashboards and workflows',
    'Notification system for important updates',
    'Detailed reporting and export capabilities'
  ]

  const stats = [
    { label: 'Students Placed', value: '500+', icon: TrophyIcon },
    { label: 'Success Rate', value: '95%', icon: ChartBarIcon },
    { label: 'Partner Companies', value: '50+', icon: UserGroupIcon },
    { label: 'Active Users', value: '1000+', icon: SparklesIcon }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                PlacementPro
              </span>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 mb-8 border border-white/20">
              <SparklesIcon className="h-4 w-4 mr-2 text-blue-600" />
              Next-Generation Placement Management
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Streamline Your
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Placement Process
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              A comprehensive solution connecting students, trainers, and coordinators 
              with intelligent job matching, performance tracking, and advanced analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                Start Your Journey
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
        
        {/* Stats Section */}
        <div className="mt-16 sm:mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className="text-center group">
                    <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl shadow-lg group-hover:shadow-xl transition-shadow mb-3 sm:mb-4">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Powerful Features for Every Role
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Built with modern technologies to provide a seamless experience for all stakeholders
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="group relative bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:-translate-y-2">
                  <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r ${feature.gradient} mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 sm:mb-8">
                Why Choose Our Platform?
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-10 leading-relaxed">
                Our comprehensive solution addresses all aspects of placement coordination, 
                from student evaluation to job matching and performance analytics.
              </p>
              <div className="space-y-4 sm:space-y-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start group">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-3 sm:mr-4 group-hover:scale-110 transition-transform">
                      <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <span className="text-gray-700 text-base sm:text-lg leading-relaxed">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative mt-8 lg:mt-0">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-white/20">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl sm:rounded-2xl mb-6 sm:mb-8">
                    <RocketLaunchIcon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                    Ready to Get Started?
                  </h3>
                  <p className="text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
                    Join thousands of students, trainers, and coordinators who trust our platform
                  </p>
                  <Link
                    to="/register"
                    className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-base sm:text-lg font-semibold rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                  >
                    Create Account
                    <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
              <div className="pointer-events-none absolute -inset-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl opacity-70"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <AcademicCapIcon className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                PlacementPro
              </span>
            </div>
            <p className="text-gray-400 mb-8 text-lg max-w-2xl mx-auto">
              Empowering educational institutions with intelligent placement coordination and student success tracking.
            </p>
            <div className="flex justify-center space-x-8 mb-8">
              <Link to="/login" className="text-gray-400 hover:text-white transition-colors text-lg font-medium">
                Sign In
              </Link>
              <Link to="/register" className="text-gray-400 hover:text-white transition-colors text-lg font-medium">
                Register
              </Link>
            </div>
            <div className="pt-8 border-t border-gray-700">
              <p className="text-gray-500 text-sm">
                © 2026 PlacementPro. Built with React, Node.js, and modern web technologies.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
