import { FaUserGraduate, FaChalkboardTeacher, FaBriefcase, FaClipboardCheck } from 'react-icons/fa';

const statCards = [
  {
    title: 'Total Students',
    value: '1,234',
    icon: <FaUserGraduate className="text-3xl" />,
    color: 'bg-blue-100 text-blue-600',
    trend: '+12% from last month'
  },
  {
    title: 'Active Trainers',
    value: '42',
    icon: <FaChalkboardTeacher className="text-3xl" />,
    color: 'bg-green-100 text-green-600',
    trend: '+3 this month'
  },
  {
    title: 'Open Positions',
    value: '156',
    icon: <FaBriefcase className="text-3xl" />,
    color: 'bg-purple-100 text-purple-600',
    trend: '5 new today'
  },
  {
    title: 'Pending Approvals',
    value: '8',
    icon: <FaClipboardCheck className="text-3xl" />,
    color: 'bg-amber-100 text-amber-600',
    trend: 'Needs attention'
  }
];

export default function DashboardStats() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.title}</p>
              <p className="text-2xl font-semibold mt-1">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.trend}</p>
            </div>
            <div className={`p-3 rounded-xl ${stat.color}`}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
