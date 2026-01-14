import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  FiCheck, 
  FiX, 
  FiClock, 
  FiUserCheck, 
  FiUserX,
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import api from '../../services/api';

const statusMap = {
  pending: { 
    text: 'Pending', 
    icon: <FiClock className="mr-1.5" />,
    bg: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200'
  },
  approved: { 
    text: 'Approved', 
    icon: <FiUserCheck className="mr-1.5" />,
    bg: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200'
  },
  rejected: { 
    text: 'Rejected', 
    icon: <FiUserX className="mr-1.5" />,
    bg: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200'
  }
};

const TrainerApprovalList = () => {
  const [trainers, setTrainers] = useState({
    pending: [],
    approved: [],
    rejected: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [removingTrainerId, setRemovingTrainerId] = useState(null);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      setLoading(true);
      // Fetch all trainers (any status) and group by trainerStatus
      const response = await api.get('/users', {
        params: { role: 'trainer', limit: 1000 }
      });

      const raw = response.data?.data?.users || [];

      const grouped = raw.reduce((acc, trainer) => {
        const status = trainer.trainerStatus || 'pending';
        const normalized = {
          ...trainer,
          name: trainer.name || { first: 'Unknown', last: 'User' },
          email: trainer.email || 'No email provided',
          program: trainer.program || trainer.specialization || 'Not specified',
          joinDate: trainer.createdAt || new Date().toISOString()
        };

        if (!acc[status]) acc[status] = [];
        acc[status].push(normalized);
        return acc;
      }, { pending: [], approved: [], rejected: [] });

      setTrainers(grouped);
    } catch (error) {
      toast.error('Failed to fetch trainers');
      console.error('Error fetching trainers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (trainerId, status) => {
    try {
      await api.put(`/users/trainer-approval/${trainerId}`, { status });
      toast.success(`Trainer ${status} successfully`);
      fetchTrainers(); // Refresh the list
    } catch (error) {
      toast.error(`Failed to ${status} trainer`);
      console.error(`Error ${status} trainer:`, error);
    }
  };

  const handleRemoveTrainer = async (trainer) => {
    const confirmRemove = window.confirm('Are you sure you want to remove this trainer?')
    if (!confirmRemove) return

    try {
      setRemovingTrainerId(trainer._id)
      await api.put(`/users/${trainer._id}/status`, { isActive: false })
      toast.success('Trainer removed successfully')
      await fetchTrainers()
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to remove trainer')
      console.error('Error removing trainer:', error)
    } finally {
      setRemovingTrainerId(null)
    }
  }

  const filteredTrainers = trainers[activeTab]?.filter(trainer => 
    `${trainer.name?.first} ${trainer.name?.last} ${trainer.email} ${trainer.program}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  ) || [];

  // Pagination logic
  const totalPages = Math.ceil(filteredTrainers.length / itemsPerPage);
  const currentItems = filteredTrainers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trainer Management</h1>
        <p className="text-gray-600">Review and manage trainer registrations</p>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search trainers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center">
              <FiFilter className="mr-2" />
              Filters
            </button>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={fetchTrainers}
            >
              Refresh
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['pending', 'approved', 'rejected'].map((tab) => {
              const status = statusMap[tab];
              return (
                <button
                  key={tab}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(1);
                  }}
                >
                  {status.icon}
                  <span className="ml-2">
                    {status.text} ({trainers[tab]?.length || 0})
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {currentItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Trainer Name
                      </th>
                      <th scope="col" className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Program
                      </th>
                      <th scope="col" className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Joined On
                      </th>
                      <th scope="col" className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {currentItems.map((trainer) => {
                      const status = statusMap[trainer.trainerStatus] || statusMap.pending
                      const joinedOn = trainer.joinDate ? new Date(trainer.joinDate).toLocaleDateString() : '—'
                      const name = `${trainer.name?.first || ''} ${trainer.name?.last || ''}`.trim() || '—'

                      return (
                        <tr key={trainer._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trainer.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trainer.program || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.textColor} ${status.borderColor} border`}>
                              {status.icon}
                              {status.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{joinedOn}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            {trainer.trainerStatus === 'pending' ? (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => handleStatusUpdate(trainer._id, 'approved')}
                                  className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                                >
                                  <FiCheck className="w-4 h-4 mr-1" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(trainer._id, 'rejected')}
                                  className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                                >
                                  <FiX className="w-4 h-4 mr-1" />
                                  Reject
                                </button>
                              </div>
                            ) : trainer.trainerStatus === 'approved' ? (
                              <button
                                className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleRemoveTrainer(trainer)}
                                disabled={removingTrainerId === trainer._id}
                              >
                                {removingTrainerId === trainer._id ? 'Removing...' : 'Remove'}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-500">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <FiUserX className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No {activeTab} trainers found</h3>
                <p className="mt-1 text-gray-500">
                  {searchQuery 
                    ? 'No trainers match your search criteria.' 
                    : `There are currently no ${activeTab} trainers.`}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 px-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FiChevronLeft className="inline-block -ml-1 mr-1" />
                Previous
              </button>
              
              <div className="hidden md:flex space-x-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 border text-sm font-medium rounded-md ${
                        currentPage === pageNum
                          ? 'bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span className="px-4 py-2 text-gray-500">...</span>
                )}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
                  >
                    {totalPages}
                  </button>
                )}
              </div>
              
              <div className="md:hidden text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
                <FiChevronRight className="inline-block -mr-1 ml-1" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TrainerApprovalList;
