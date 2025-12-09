import React, { useState, useEffect } from 'react'
import { notificationsAPI } from '../services/api'
import { 
  BellIcon, 
  CheckIcon, 
  TrashIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, read
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchNotifications()
  }, [filter, page])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 20,
        ...(filter === 'unread' && { isRead: false }),
        ...(filter === 'read' && { isRead: true })
      }

      const response = await notificationsAPI.getNotifications(params)
      if (response.data.success) {
        setNotifications(response.data.data.notifications)
        setTotalPages(response.data.data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markSingleAsRead(notificationId)
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif
        )
      )
      toast.success('Notification marked as read')
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAsRead({ markAll: true })
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
      )
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Failed to mark all notifications as read')
    }
  }

  const deleteNotification = async (notificationId) => {
    try {
      await notificationsAPI.deleteNotification(notificationId)
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId))
      toast.success('Notification deleted')
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job_match':
        return '💼'
      case 'evaluation':
        return '📊'
      case 'approval':
        return '✅'
      case 'test_result':
        return '📝'
      case 'deadline':
        return '⏰'
      default:
        return '📢'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-danger-600 bg-danger-50 border-danger-200'
      case 'high':
        return 'text-warning-600 bg-warning-50 border-warning-200'
      case 'medium':
        return 'text-primary-600 bg-primary-50 border-primary-200'
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatDate = (date) => {
    const now = new Date()
    const notifDate = new Date(date)
    const diffInHours = Math.floor((now - notifDate) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      return 'Just now'
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else if (diffInHours < 48) {
      return 'Yesterday'
    } else {
      return notifDate.toLocaleDateString()
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">
            Stay updated with your placement activities
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="btn-secondary text-sm"
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        {['all', 'unread', 'read'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => {
              setFilter(filterOption)
              setPage(1)
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === filterOption
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            {filterOption === 'unread' && unreadCount > 0 && (
              <span className="ml-2 bg-danger-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="card p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No notifications
            </h3>
            <p className="text-gray-500">
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet."
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border ${
                      getPriorityColor(notification.priority)
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${
                          notification.isRead ? 'text-gray-900' : 'text-gray-900 font-semibold'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className={`mt-1 text-sm ${
                          notification.isRead ? 'text-gray-600' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="mt-2 flex items-center space-x-4">
                          <span className="text-xs text-gray-500 flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            {formatDate(notification.createdAt)}
                          </span>
                          <span className={`badge badge-${notification.priority === 'urgent' ? 'danger' : 
                            notification.priority === 'high' ? 'warning' : 
                            notification.priority === 'medium' ? 'primary' : 'gray'}`}>
                            {notification.priority}
                          </span>
                          <span className={`badge ${
                            notification.type === 'job_match' ? 'badge-primary' :
                            notification.type === 'evaluation' ? 'badge-success' :
                            notification.type === 'approval' ? 'badge-warning' :
                            'badge-gray'
                          }`}>
                            {notification.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                            title="Mark as read"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="p-1 text-gray-400 hover:text-danger-600 transition-colors"
                          title="Delete notification"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Action Button */}
                    {notification.actionButton && (
                      <div className="mt-3">
                        <button className="btn-primary text-xs px-3 py-1">
                          {notification.actionButton.text}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            disabled={page === 1}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          
          <button
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
