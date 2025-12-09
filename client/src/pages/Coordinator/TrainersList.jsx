import { useState, useEffect } from 'react'
import { FiSearch, FiRefreshCcw, FiUserCheck, FiUserX } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../services/api'

const TrainersList = () => {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filtered.length > 0 ? (
                filtered.map(trainer => (
                  <motion.div
                    key={trainer._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-5">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-medium text-lg">
                          {trainer.name?.first?.charAt(0)}{trainer.name?.last?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {trainer.name?.first} {trainer.name?.last}
                          </h3>
                          <p className="text-sm text-gray-500">{trainer.email}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                              <FiUserCheck className="mr-1.5" />
                              Approved
                            </span>
                            <span>•</span>
                            <span>{trainer.specialization}</span>
                            <span>•</span>
                            <span>{trainer.experience} years exp</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                        <span>
                          Joined {new Date(trainer.joinDate).toLocaleDateString()}
                        </span>
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                          View Profile
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <FiUserX className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No approved trainers found</h3>
                  <p className="mt-1 text-gray-500">
                    Once trainers are approved from the Approvals section, they will appear here.
                  </p>
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
