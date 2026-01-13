import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiRefreshCcw, FiUserCheck, FiUserX } from 'react-icons/fi'
import { AnimatePresence } from 'framer-motion'
import api from '../../services/api'

const TrainersList = () => {
  const navigate = useNavigate()
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchApprovedTrainers()
  }, [])

  const fetchApprovedTrainers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users', {
        params: { role: 'trainer', limit: 500 }
      })

      const raw = response.data?.data?.users || []

      const approved = raw
        .filter(trainer => trainer.trainerStatus === 'approved')
        .map(trainer => ({
          ...trainer,
          name: trainer.name || { first: 'Unknown', last: 'User' },
          email: trainer.email || 'No email provided',
          specialization: trainer.specialization || 'Not specified',
          experience: trainer.experience || '0',
          joinDate: trainer.createdAt || new Date().toISOString(),
        }))

      setTrainers(approved)
    } catch (error) {
      console.error('Error fetching approved trainers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = trainers.filter(trainer =>
    `${trainer.name?.first} ${trainer.name?.last} ${trainer.email} ${trainer.specialization}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trainers</h1>
        <p className="text-gray-600">List of all approved trainers in the system</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
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

        <button
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={fetchApprovedTrainers}
        >
          <FiRefreshCcw className="mr-2" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <AnimatePresence>
              {filtered.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Trainer
                        </th>
                        <th scope="col" className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Specialization
                        </th>
                        <th scope="col" className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Experience
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
                      {filtered.map((trainer) => {
                        const initials = `${trainer.name?.first?.charAt(0) || 'U'}${trainer.name?.last?.charAt(0) || ''}`
                        const joinedOn = trainer.joinDate ? new Date(trainer.joinDate).toLocaleDateString() : '—'

                        return (
                          <tr key={trainer._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-medium">
                                  {initials}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {trainer.name?.first} {trainer.name?.last}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {trainer.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-medium">
                                <FiUserCheck className="mr-1.5" />
                                Approved
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {trainer.specialization || 'Not specified'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {trainer.experience} years
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {joinedOn}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <button
                                className="text-blue-600 hover:text-blue-800 font-medium"
                                onClick={() => navigate(`/dashboard/trainers/${trainer._id}`)}
                              >
                                View Profile
                              </button>
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
                  <h3 className="text-lg font-medium text-gray-900">No trainers found</h3>
                  <p className="mt-1 text-gray-500">Try adjusting your search or refresh the list.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}

export default TrainersList
