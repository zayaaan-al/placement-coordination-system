import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Header from '../../../components/Layout/Header';
import { 
  FiHome, 
  FiUsers, 
  FiBriefcase, 
  FiCheckCircle, 
  FiLogOut
} from 'react-icons/fi';

const menuItems = [
  { name: 'Dashboard', icon: <FiHome />, path: '.', end: true },
  { name: 'Student Management', icon: <FiUsers />, path: 'student-management' },
  { name: 'Trainers', icon: <FiUsers />, path: 'trainers' },
  { name: 'Job Management', icon: <FiBriefcase />, path: 'job-management' },
  { name: 'Placement Requests', icon: <FiCheckCircle />, path: 'placement-requests' },
  { name: 'Trainer Approvals', icon: <FiCheckCircle />, path: 'approvals' },
];

export default function CoordinatorLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const activeClass = 'bg-blue-50 text-blue-600 border-r-4 border-blue-600';
  const inactiveClass = 'text-gray-600 hover:bg-gray-50';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`w-64 bg-white shadow-lg fixed h-full flex flex-col transition-all duration-300 ease-in-out z-40 ${
          mobileMenuOpen ? 'left-0' : '-left-full md:left-0'
        }`}
      >
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? activeClass : inactiveClass
                    }`
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="ml-3">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                C
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Coordinator</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>
            <button className="text-gray-500 hover:text-gray-700">
              <FiLogOut />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300 md:ml-64"
      >
        <Header setSidebarOpen={setMobileMenuOpen} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
