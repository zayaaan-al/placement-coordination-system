import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { FiSearch, FiRefreshCcw, FiUserCheck, FiUserX } from 'react-icons/fi'
import { AnimatePresence } from 'framer-motion'
import api from '../../services/api'

const TrainersList = () => {
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [removingTrainerId, setRemovingTrainerId] = useState(null)

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
        .filter(trainer => trainer.trainerStatus === 'approved' && trainer.isActive !== false)
        .map(trainer => ({
          ...trainer,
          name: trainer.name || { first: 'Unknown', last: 'User' },
          email: trainer.email || 'No email provided',
          program: trainer.program || trainer.specialization || 'Not assigned',
          joinDate: trainer.createdAt || new Date().toISOString(),
        }))

      setTrainers(approved)
    } catch (error) {
      toast.error('Failed to fetch trainers')
      console.error('Error fetching approved trainers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveTrainer = async (trainer) => {
    const confirmRemove = window.confirm('Are you sure you want to remove this trainer?')
    if (!confirmRemove) return

    try {
      setRemovingTrainerId(trainer._id)
      await api.put(`/users/${trainer._id}/status`, { isActive: false })
      toast.success('Trainer removed successfully')

      setTrainers((prev) => prev.filter((t) => t._id !== trainer._id))
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to remove trainer')
      console.error('Error removing trainer:', error)
    } finally {
      setRemovingTrainerId(null)
    }
  }

  const filtered = trainers.filter(trainer =>
    `${trainer.name?.first} ${trainer.name?.last} ${trainer.email} ${trainer.program}`
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
                          Email
                        </th>
                        <th scope="col" className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="sticky top-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Program
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
                        const joinedOn = trainer.joinDate ? new Date(trainer.joinDate).toLocaleDateString() : '—'

                        return (
                          <tr key={trainer._id} className="hover:bg-gray-50">
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
                              {trainer.program || 'Not assigned'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {joinedOn}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <button
                                className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => handleRemoveTrainer(trainer)}
                                disabled={removingTrainerId === trainer._id}
                              >
                                {removingTrainerId === trainer._id ? 'Removing...' : 'Remove'}
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
