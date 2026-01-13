import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiUsers, 
  FiBriefcase, 
  FiCheckCircle, 
  FiBell, 
  FiSettings, 
  FiMenu, 
  FiX,
  FiChevronDown,
  FiLogOut
} from 'react-icons/fi';

const menuItems = [
  { name: 'Dashboard', icon: <FiHome />, path: '.', end: true },
  { name: 'Student Management', icon: <FiUsers />, path: 'student-management' },
  { name: 'Trainers', icon: <FiUsers />, path: 'trainers' },
  { name: 'Job Management', icon: <FiBriefcase />, path: 'job-management' },
  { name: 'Placement Requests', icon: <FiCheckCircle />, path: 'placement-requests' },
  { name: 'Approvals', icon: <FiCheckCircle />, path: 'approvals' },
  { name: 'Notifications', icon: <FiBell />, path: 'notifications' },
  { name: 'Settings', icon: <FiSettings />, path: 'settings' },
];

export default function CoordinatorLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const activeClass = 'bg-blue-50 text-blue-600 border-r-4 border-blue-600';
  const inactiveClass = 'text-gray-600 hover:bg-gray-50';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
        >
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow-lg fixed h-full flex flex-col transition-all duration-300 ease-in-out z-40 ${
          mobileMenuOpen ? 'left-0' : '-left-full md:left-0'
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-blue-600">Placement Portal</h1>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hidden md:block"
          >
            {sidebarOpen ? '«' : '»'}
          </button>
        </div>

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
                    } ${!sidebarOpen ? 'justify-center' : ''}`
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  {sidebarOpen && (
                    <span className="ml-3">{item.name}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center ${!sidebarOpen ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                C
              </div>
              {sidebarOpen && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Coordinator</p>
                  <p className="text-xs text-gray-500">Admin</p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button className="text-gray-500 hover:text-gray-700">
                <FiLogOut />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-20'
        }`}
      >
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
