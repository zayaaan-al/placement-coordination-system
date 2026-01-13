import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiCalendar, FiUserCheck, FiTrendingUp, FiChevronRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import DashboardStats from './components/DashboardStats';
import TrainerApprovalList from './TrainerApprovalList';
import CoordinatorLayout from './components/CoordinatorLayout';
import TrainersList from './TrainersList';
import TrainerProfile from './TrainerProfile';
import { adminAPI } from '../../services/api';

const formatRelativeTime = (dateLike) => {
  if (!dateLike) return '—'
  const d = new Date(dateLike)
  if (Number.isNaN(d.getTime())) return '—'

  const diffMs = Date.now() - d.getTime()
  const sec = Math.floor(diffMs / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)

  if (sec < 60) return 'just now'
  if (min < 60) return `${min} min ago`
  if (hr < 24) return `${hr} hours ago`
  return `${day} days ago`
}

// Main Dashboard Component
const DashboardHome = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)
  const [stats, setStats] = React.useState(null)
  const [upcomingPlacements, setUpcomingPlacements] = React.useState([])
  const [recentActivities, setRecentActivities] = React.useState([])

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await adminAPI.getDashboardOverview()
        const payload = res?.data?.data ?? res?.data

        if (!payload || typeof payload !== 'object') {
          throw new Error('Invalid dashboard overview response')
        }

        const nextStats = payload?.stats
        const nextUpcoming = payload?.upcomingPlacements
        const nextActivities = payload?.recentActivities

        if (!nextStats || typeof nextStats !== 'object') {
          throw new Error('Dashboard stats missing in response')
        }

        setStats(nextStats)
        setUpcomingPlacements(Array.isArray(nextUpcoming) ? nextUpcoming : [])
        setRecentActivities(Array.isArray(nextActivities) ? nextActivities : [])
      } catch (e) {
        console.error('Dashboard overview load failed:', e)
        setError(e)
        setStats(null)
        setUpcomingPlacements([])
        setRecentActivities([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your placement portal.</p>
      </div>
      
      <DashboardStats stats={stats} loading={loading} error={error} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingPlacements
          loading={loading}
          items={upcomingPlacements}
          onViewAll={() => navigate('/job-management')}
        />
        <RecentActivities
          loading={loading}
          items={recentActivities}
          onViewAll={() => navigate('/notifications')}
        />
      </div>
    </div>
  )
};

const UpcomingPlacements = ({ loading, items, onViewAll }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl shadow-sm p-6"
  >
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold">Upcoming Placements</h2>
      <button onClick={onViewAll} className="text-sm text-blue-600 hover:text-blue-800">View All</button>
    </div>
    <div className="space-y-4">
      {loading ? (
        Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mr-4">
              <FiCalendar className="text-xl" />
            </div>
            <div className="flex-1">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mt-2" />
              <div className="h-3 w-40 bg-gray-200 rounded animate-pulse mt-2" />
            </div>
          </div>
        ))
      ) : (items || []).length > 0 ? (
        (items || []).map((item, index) => {
          const dateLabel = item?.date ? new Date(item.date).toLocaleDateString() : '—'
          return (
            <div key={item?.id || index} className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mr-4">
                <FiCalendar className="text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{item.company}</h3>
                <p className="text-sm text-gray-500">{item.position}</p>
                <div className="flex items-center mt-1 text-xs text-gray-400">
                  <span>{item.type}</span>
                  <span className="mx-2">•</span>
                  <span>{dateLabel}</span>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <FiChevronRight />
              </button>
            </div>
          )
        })
      ) : (
        <div className="p-6 text-center text-sm text-gray-500">No upcoming placements.</div>
      )}
    </div>
  </motion.div>
);

const RecentActivities = ({ loading, items, onViewAll }) => {
  const getIcon = (type) => {
    if (type === 'trainer_registration_submitted') return <FiUserCheck className="text-green-500" />
    if (type === 'trainer_approved') return <FiUserCheck className="text-green-500" />
    if (type === 'trainer_rejected') return <FiAlertCircle className="text-amber-500" />
    if (type === 'placement_drive_created' || type === 'placement_drive_scheduled') return <FiCalendar className="text-blue-500" />
    if (type === 'student_placed') return <FiTrendingUp className="text-green-500" />
    if (type === 'student_removed_from_placement') return <FiAlertCircle className="text-amber-500" />
    return <FiAlertCircle className="text-amber-500" />
  }

  const list = items || []

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Activities</h2>
        <button onClick={onViewAll} className="text-sm text-blue-600 hover:text-blue-800">View All</button>
      </div>
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="p-2 bg-gray-50 rounded-lg text-gray-600 mr-4 group-hover:bg-gray-100 transition-colors">
                <FiAlertCircle className="text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-56 bg-gray-200 rounded animate-pulse mt-2" />
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mt-2" />
              </div>
            </div>
          ))
        ) : list.length > 0 ? (
          list.map((activity) => (
            <div key={activity.id} className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors group">
              <div className="p-2 bg-gray-50 rounded-lg text-gray-600 mr-4 group-hover:bg-gray-100 transition-colors">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{activity.title}</h3>
                <p className="text-sm text-gray-500 truncate">{activity.description}</p>
                <span className="text-xs text-gray-400">{formatRelativeTime(activity.createdAt)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-sm text-gray-500">No recent activity.</div>
        )}
      </div>
    </motion.div>
  );
};

// Main Coordinator Dashboard with Layout
const CoordinatorDashboard = () => {
  return (
    <CoordinatorLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="trainers" element={<TrainersList />} />
        <Route path="trainers/:id" element={<TrainerProfile />} />
        <Route path="approvals" element={<TrainerApprovalList />} />
        {/* Add more routes as needed */}
      </Routes>
    </CoordinatorLayout>
  );
};

export default CoordinatorDashboard;
