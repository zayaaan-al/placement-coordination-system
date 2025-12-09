import React from 'react'

const AuthFooter = () => {
  return (
    <footer className="w-full py-4 px-4 sm:px-8 text-center text-xs sm:text-sm text-gray-500">
      <p className="mb-1">
        &copy; {new Date().getFullYear()} PlacementPro. All rights reserved.
      </p>
      <p className="space-x-3">
        <span className="hidden sm:inline">Empowering students, trainers, and coordinators for better placements.</span>
      </p>
    </footer>
  )
}

export default AuthFooter
