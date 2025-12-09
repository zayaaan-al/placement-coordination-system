import React from 'react'
import { Link } from 'react-router-dom'
import { HomeIcon, ArrowLeftIcon, AcademicCapIcon } from '@heroicons/react/24/outline'

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-12">
          <div className="text-center">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-8">
              <AcademicCapIcon className="h-10 w-10 text-white" />
            </div>
            
            {/* 404 Number */}
            <h1 className="text-8xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              404
            </h1>
            
            {/* Title */}
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Page not found
            </h2>
            
            {/* Description */}
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                <HomeIcon className="mr-2 h-5 w-5" />
                Go home
              </Link>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 text-sm font-semibold rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <ArrowLeftIcon className="mr-2 h-5 w-5" />
                Go back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
