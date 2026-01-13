import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FiArrowLeft, FiUserCheck, FiUserX } from 'react-icons/fi'
import api from '../../services/api'

const TrainerProfile = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  const [loading, setLoading] = useState(true)
  const [trainer, setTrainer] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/users/id/${id}`)
        setTrainer(res?.data?.data || null)
      } catch (e) {
        console.error('Failed to load trainer profile:', e)
        setTrainer(null)
      } finally {
        setLoading(false)
      }
    }

    if (id) load()
  }, [id])

  const fullName = `${trainer?.name?.first || ''} ${trainer?.name?.last || ''}`.trim() || 'Trainer'
  const initials = `${trainer?.name?.first?.charAt(0) || 'T'}${trainer?.name?.last?.charAt(0) || ''}`
  const joinedOn = trainer?.createdAt ? new Date(trainer.createdAt).toLocaleDateString() : '—'
  const specialization = trainer?.specialization || 'Not specified'
  const experience = trainer?.experience || '0'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trainer Profile</h1>
          <p className="text-gray-600">View trainer details</p>
        </div>

        <button
          className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50"
          onClick={() => navigate('/dashboard/trainers')}
        >
          <FiArrowLeft className="mr-2" />
          Back
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : trainer ? (
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-semibold text-xl">
              {initials}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{fullName}</h2>
                <p className="text-gray-600">{trainer?.email || 'No email provided'}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {trainer?.trainerStatus === 'approved' ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-medium">
                    <FiUserCheck className="mr-1.5" />
                    Approved
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
                    <FiUserX className="mr-1.5" />
                    {trainer?.trainerStatus || 'Unknown'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Specialization</p>
                  <p className="mt-1 text-sm text-gray-900">{specialization}</p>
                </div>

                <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Experience</p>
                  <p className="mt-1 text-sm text-gray-900">{experience} years</p>
                </div>

                <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Joined On</p>
                  <p className="mt-1 text-sm text-gray-900">{joinedOn}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FiUserX className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Trainer not found</h3>
            <p className="mt-1 text-gray-500">This trainer may have been removed or you don't have access.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrainerProfile
