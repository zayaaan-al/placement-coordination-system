import React from 'react'
import { Link } from 'react-router-dom'

const AuthNav = () => {
  return (
    <header className="w-full py-4 px-4 sm:px-8 flex items-center justify-between">
      <Link to="/" className="flex items-center space-x-2">
        <div className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
          <span className="text-white text-lg font-bold">P</span>
        </div>
        <div className="flex flex-col">
          <span className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">PlacementPro</span>
          <span className="text-xs text-gray-500 hidden sm:block">Placement Coordination System</span>
        </div>
      </Link>

      <nav className="flex items-center space-x-4 text-xs sm:text-sm text-gray-600">
        <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
      </nav>
    </header>
  )
}

export default AuthNav
