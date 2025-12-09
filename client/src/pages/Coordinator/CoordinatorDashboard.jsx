import { Routes, Route } from 'react-router-dom';
import { FiAlertCircle, FiCalendar, FiUserCheck, FiTrendingUp, FiChevronRight } from 'react-icons/fi';
import { motion } from 'framer-motion';
import DashboardStats from './components/DashboardStats';
import TrainerApprovalList from './TrainerApprovalList';
import CoordinatorLayout from './components/CoordinatorLayout';
import TrainersList from './TrainersList';

// Main Dashboard Component
const DashboardHome = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
      <p className="text-gray-600">Welcome back! Here's what's happening with your placement portal.</p>
    </div>
    
    <DashboardStats />
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <UpcomingPlacements />
      <RecentActivities />
    </div>
  </div>
);

const UpcomingPlacements = () => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl shadow-sm p-6"
  >
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold">Upcoming Placements</h2>
      <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
    </div>
    <div className="space-y-4">
      {[
        { company: 'TechCorp', date: 'Dec 15, 2023', position: 'Software Engineer', type: 'Campus Drive' },
        { company: 'DataSystems', date: 'Dec 20, 2023', position: 'Data Analyst', type: 'Off-Campus' },
        { company: 'WebSolutions', date: 'Jan 5, 2024', position: 'Frontend Developer', type: 'Pool Campus' },
      ].map((item, index) => (
        <div key={index} className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mr-4">
            <FiCalendar className="text-xl" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">{item.company}</h3>
            <p className="text-sm text-gray-500">{item.position}</p>
            <div className="flex items-center mt-1 text-xs text-gray-400">
              <span>{item.type}</span>
              <span className="mx-2">•</span>
              <span>{item.date}</span>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <FiChevronRight />
          </button>
        </div>
      ))}
    </div>
  </motion.div>
);

const RecentActivities = () => {
  const activities = [
    {
      id: 1,
      type: 'new_trainer',
      title: 'New Trainer Registration',
      description: 'John Doe registered as a trainer',
      time: '2 hours ago',
      icon: <FiUserCheck className="text-green-500" />,
    },
    {
      id: 2,
      type: 'placement',
      title: 'Placement Drive Scheduled',
      description: 'Google campus drive on 15th Dec',
      time: '1 day ago',
      icon: <FiCalendar className="text-blue-500" />,
    },
    {
      id: 3,
      type: 'alert',
      title: 'Action Required',
      description: '5 pending trainer approvals',
      time: '3 days ago',
      icon: <FiAlertCircle className="text-amber-500" />,
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Activities</h2>
        <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <div className="p-2 bg-gray-50 rounded-lg text-gray-600 mr-4 group-hover:bg-gray-100 transition-colors">
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{activity.title}</h3>
              <p className="text-sm text-gray-500 truncate">{activity.description}</p>
              <span className="text-xs text-gray-400">{activity.time}</span>
            </div>
          </div>
        ))}
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
        <Route path="/trainers" element={<TrainersList />} />
        <Route path="/approvals" element={<TrainerApprovalList />} />
        {/* Add more routes as needed */}
      </Routes>
    </CoordinatorLayout>
  );
};

export default CoordinatorDashboard;
