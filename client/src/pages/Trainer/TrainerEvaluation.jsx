import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { trainersAPI } from '../../services/api'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

const TrainerEvaluation = () => {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [evaluationHistory, setEvaluationHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingEvaluation, setEditingEvaluation] = useState(null)
  const [formValues, setFormValues] = useState({
    type: 'aptitude',
    score: '',
    maxScore: 25,
    recordedDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const evaluationTypeOptions = useMemo(() => ([
    { value: 'aptitude', label: 'Aptitude (Weekly, out of 25)' },
    { value: 'logical', label: 'Logical (Weekly)' },
    { value: 'machine', label: 'Machine (Weekly)' },
    { value: 'spring_meet', label: 'Spring Meet (Monthly)' }
  ]), [])

  const defaultMaxScore = (type) => {
    switch (type) {
      case 'spring_meet':
        return 100
      case 'aptitude':
        return 25
      default:
        return 25
    }
  }

  const fetchEvaluationHistory = async (studentProfileId) => {
    try {
      setHistoryLoading(true)
      const res = await trainersAPI.getStudentEvaluations(studentProfileId)
      if (res.data.success) {
        setEvaluationHistory(res.data.data || [])
      }
    } catch (error) {
      console.error('Failed to load evaluation history', error)
      toast.error('Could not load evaluation history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleFormChange = (field, value) => {
    if (field === 'type') {
      const nextMax = defaultMaxScore(value)
      setFormValues((prev) => ({
        ...prev,
        type: value,
        maxScore: value === 'aptitude' ? 25 : nextMax
      }))
      return
    }

    setFormValues((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!selectedStudent) {
      toast.error('Select a student first')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        type: formValues.type,
        score: Number(formValues.score),
        maxScore: Number(formValues.maxScore),
        recordedDate: formValues.recordedDate,
        notes: formValues.notes
      }

      if (editingEvaluation) {
        await trainersAPI.updateEvaluation(editingEvaluation._id, payload)
        toast.success('Evaluation updated')
      } else {
        await trainersAPI.recordEvaluation(selectedStudent._id, payload)
        toast.success('Evaluation recorded')
      }

      await fetchEvaluationHistory(selectedStudent._id)
      setEditingEvaluation(null)
      setFormValues((prev) => ({
        ...prev,
        score: '',
        notes: ''
      }))
    } catch (error) {
      console.error('Failed to submit evaluation', error)
      toast.error(error.response?.data?.error || 'Failed to save evaluation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditEvaluation = (evaluation) => {
    setEditingEvaluation(evaluation)
    setFormValues({
      type: evaluation.type,
      score: evaluation.score,
      maxScore: evaluation.maxScore,
      recordedDate: evaluation.recordedDate ? evaluation.recordedDate.slice(0, 10) : new Date().toISOString().split('T')[0],
      notes: evaluation.notes || ''
    })
  }

  const resetEditing = () => {
    setEditingEvaluation(null)
    setFormValues({
      type: 'aptitude',
      score: '',
      maxScore: 25,
      recordedDate: new Date().toISOString().split('T')[0],
      notes: ''
    })
  }

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await trainersAPI.getTrainerStudents(user._id, { limit: 100 })
        if (res.data.success) {
          setStudents(res.data.data.students || [])
        }
      } catch (error) {
        console.error('Error fetching trainer students:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user?._id) {
      fetchStudents()
    }
  }, [user])

  const handleSelectStudent = async (student) => {
    if (!student) return
    setSelectedStudent(student)
    setEditingEvaluation(null)
    setFormValues({
      type: 'aptitude',
      score: '',
      maxScore: 25,
      recordedDate: new Date().toISOString().split('T')[0],
      notes: ''
    })
    await fetchEvaluationHistory(student._id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Evaluations</h1>
        <p className="text-gray-600">Select a student to record weekly and monthly scores.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          {students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map(student => {
                    const isActive = selectedStudent?._id === student._id
                    return (
                      <tr key={student._id} className={isActive ? 'bg-primary-50/60' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.userId?.name?.first} {student.userId?.name?.last}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.rollNo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.batch}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.aggregateScore}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => handleSelectStudent(student)}
                            className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-primary-600 text-white hover:bg-primary-700"
                          >
                            Evaluate
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-gray-500">
              No approved students assigned yet.
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 xl:col-span-1 flex flex-col">
          <div className="px-6 py-5 border-b bg-gradient-to-r from-primary-600/10 to-primary-500/10 rounded-t-2xl flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-primary-700 font-semibold">Evaluation panel</p>
              <h2 className="text-xl font-bold text-gray-900 mt-1">
                {selectedStudent ? `${selectedStudent.userId?.name?.first} ${selectedStudent.userId?.name?.last}` : 'Select a student'}
              </h2>
              {selectedStudent && (
                <p className="text-xs text-gray-600">
                  Roll No: {selectedStudent.rollNo} · Batch: {selectedStudent.batch}
                </p>
              )}
            </div>
            <button
              onClick={() => selectedStudent && fetchEvaluationHistory(selectedStudent._id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-primary-700 bg-white border border-primary-100 hover:bg-primary-50 disabled:opacity-40"
              disabled={!selectedStudent || historyLoading}
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>
          </div>
          {selectedStudent ? (
            <div className="flex-1 grid grid-cols-1 gap-0 divide-y lg:divide-none">
              <div className="p-6">
                <h4 className="text-base font-semibold text-gray-900 mb-4">
                  {editingEvaluation ? 'Update Evaluation' : 'Record New Evaluation'}
                </h4>
                <form className="space-y-5" onSubmit={handleFormSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Test Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {evaluationTypeOptions.map((option) => {
                        const isActive = formValues.type === option.value
                        return (
                          <button
                            type="button"
                            key={option.value}
                            onClick={() => handleFormChange('type', option.value)}
                            className={`rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                              isActive
                                ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                                : 'border-gray-200 hover:border-primary-200'
                            }`}
                          >
                            <p className="font-semibold capitalize">{option.value.replace('_', ' ')}</p>
                            <p className="text-xs text-gray-500">{option.label.split('(')[1]?.replace(')', '')}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-3">
                      <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase mb-1">Score</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-200 transition"
                          value={formValues.score}
                          onChange={(e) => handleFormChange('score', e.target.value)}
                          required
                        />
                        <span className="absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">pts</span>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-3">
                      <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase mb-1">Max Score</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-200 transition disabled:bg-gray-100 disabled:text-gray-400"
                          value={formValues.maxScore}
                          onChange={(e) => handleFormChange('maxScore', e.target.value)}
                          required
                          disabled={formValues.type === 'aptitude'}
                        />
                        <span className="absolute inset-y-0 right-3 flex items-center text-xs text-gray-400">max</span>
                      </div>
                      {formValues.type === 'aptitude' && (
                        <p className="text-xs text-primary-600 mt-2">Aptitude test is fixed at 25 marks.</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-3">
                    <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase mb-1">Recorded Date</label>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-200 transition"
                      value={formValues.recordedDate}
                      onChange={(e) => handleFormChange('recordedDate', e.target.value)}
                      required
                    />
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-3">
                    <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase mb-1">Notes (optional)</label>
                    <textarea
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-200 transition"
                      rows="3"
                      value={formValues.notes}
                      onChange={(e) => handleFormChange('notes', e.target.value)}
                      placeholder="Add remarks or feedback"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    {editingEvaluation ? (
                      <button
                        type="button"
                        onClick={resetEditing}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        + Record new attempt
                      </button>
                    ) : <span />}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-full bg-primary-600 text-white px-5 py-2.5 text-sm font-semibold shadow-md hover:bg-primary-700 disabled:opacity-60"
                    >
                      {submitting ? 'Saving...' : editingEvaluation ? 'Update Evaluation' : 'Save Evaluation'}
                    </button>
                  </div>
                </form>
              </div>
              <div className="p-6 bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-semibold text-gray-900">Evaluation History</h4>
                  <button
                    onClick={() => fetchEvaluationHistory(selectedStudent._id)}
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    Refresh
                  </button>
                </div>
                {historyLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <LoadingSpinner />
                  </div>
                ) : evaluationHistory.length > 0 ? (
                  <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-2">
                    {evaluationHistory.map((evaluation) => (
                      <div
                        key={evaluation._id}
                        className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 capitalize">{evaluation.type.replace('_', ' ')}</p>
                            <p className="text-xs text-gray-500">{evaluation.periodLabel}</p>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {evaluation.score}/{evaluation.maxScore}
                          </span>
                        </div>
                        {evaluation.notes && (
                          <p className="text-sm text-gray-600 mt-2">{evaluation.notes}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">
                            {new Date(evaluation.recordedDate).toLocaleDateString()}
                          </p>
                          <button
                            onClick={() => handleEditEvaluation(evaluation)}
                            className="text-xs text-primary-600 hover:text-primary-500"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 text-sm">
                    No evaluations recorded yet.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500 p-6">
              Select a student in the list to start evaluating.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TrainerEvaluation
