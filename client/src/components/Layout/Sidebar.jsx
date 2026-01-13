import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  HomeIcon,
  UserIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  BellIcon,
  CogIcon,
  AcademicCapIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth()
  const location = useLocation()

  const getNavigationItems = () => {
    const commonItems = [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      { name: 'Notifications', href: '/notifications', icon: BellIcon },
    ]

    const roleSpecificItems = {
      student: [
        { name: 'My Profile', href: '/profile', icon: UserIcon },
        { name: 'Job Opportunities', href: '/jobs', icon: BriefcaseIcon },
        { name: 'Performance', href: '/students/performance', icon: ChartBarIcon },
      ],
      trainer: [
        { name: 'Students', href: '/students', icon: UserGroupIcon },
        { name: 'Evaluations', href: '/evaluations', icon: DocumentTextIcon },
        { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
      ],
      coordinator: [
        { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
      ],
      admin: [
        { name: 'Reports', href: '/reports', icon: DocumentTextIcon },
      ]
    }

    return [
      ...commonItems,
      ...(roleSpecificItems[user?.role] || [])
    ]
  }

  const navigation = getNavigationItems()

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center flex-shrink-0 px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
            <AcademicCapIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            PlacementPro
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 sm:px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={clsx(
                'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                isActive 
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-l-4 border-blue-500 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className={clsx(
                'mr-3 h-5 w-5 flex-shrink-0',
                isActive ? 'text-blue-600' : 'text-gray-400'
              )} />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="flex-shrink-0 px-3 sm:px-4 py-3 sm:py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xs sm:text-sm font-medium text-blue-600">
                {user?.name?.first?.[0]}{user?.name?.last?.[0]}
              </span>
            </div>
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name?.first} {user?.name?.last}
            </p>
            <p className="text-xs text-gray-500 truncate capitalize">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex flex-col w-64 bg-white h-full shadow-xl">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200">
        <SidebarContent />
      </div>
    </>
  )
}

export default Sidebar
