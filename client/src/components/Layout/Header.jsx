import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { notificationsAPI } from '../../services/api'
import {
  Bars3Icon,
  BellIcon,
  ChevronDownIcon,
  UserIcon,
  CogIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import clsx from 'clsx'

const Header = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchUnreadCount()
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount()
      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex justify-between h-14 sm:h-16">
          {/* Left side */}
          <div className="flex items-center min-w-0 flex-1">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden -ml-0.5 -mt-0.5 h-10 w-10 sm:h-12 sm:w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Page title or breadcrumb can go here */}
            <div className="ml-2 sm:ml-4 lg:ml-0 min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-medium text-gray-900 capitalize truncate">
                {user?.role} Dashboard
              </h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Notifications */}
            <Link
              to="/notifications"
              className="relative p-1.5 sm:p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-colors"
            >
              <BellIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Profile dropdown */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-medium text-blue-600">
                      {user?.name?.first?.[0]}{user?.name?.last?.[0]}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                      {user?.name?.first} {user?.name?.last}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role}
                    </p>
                  </div>
                  <ChevronDownIcon className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                </div>
              </Menu.Button>

              <Transition
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/profile"
                        className={clsx(
                          active ? 'bg-gray-100' : '',
                          'flex items-center px-4 py-2 text-sm text-gray-700'
                        )}
                      >
                        <UserIcon className="mr-3 h-4 w-4" />
                        Your Profile
                      </Link>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/settings"
                        className={clsx(
                          active ? 'bg-gray-100' : '',
                          'flex items-center px-4 py-2 text-sm text-gray-700'
                        )}
                      >
                        <CogIcon className="mr-3 h-4 w-4" />
                        Settings
                      </Link>
                    )}
                  </Menu.Item>

                  <div className="border-t border-gray-100" />

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={clsx(
                          active ? 'bg-gray-100' : '',
                          'flex items-center w-full px-4 py-2 text-sm text-gray-700'
                        )}
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
