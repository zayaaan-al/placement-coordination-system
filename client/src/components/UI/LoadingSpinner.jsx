import React from 'react'
import clsx from 'clsx'

const LoadingSpinner = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  }

  return (
    <div className={clsx(
      'animate-spin rounded-full border-b-2 border-blue-600',
      sizeClasses[size],
      className
    )} />
  )
}

export default LoadingSpinner
