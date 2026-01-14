import React from 'react'

const toDateTimeLocal = (dateLike) => {
  if (!dateLike) return ''
  const d = new Date(dateLike)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const normalizeSkills = (skills) => {
  if (!Array.isArray(skills) || skills.length === 0) return [{ name: '', minLevel: '' }]
  return skills.map((s) => ({
    name: s?.name ?? '',
    minLevel: s?.minLevel ?? ''
  }))
}

const JobForm = ({ mode, initialJob, onSubmit, submitting, readOnly }) => {
  const [form, setForm] = React.useState(() => ({
    title: initialJob?.title ?? '',
    description: initialJob?.description ?? '',
    location: initialJob?.location ?? '',
    jobType: initialJob?.jobType ?? 'full-time',
    positions: initialJob?.positions ?? 1,
    minAggregateScore: initialJob?.minAggregateScore ?? 0,
    deadline: toDateTimeLocal(initialJob?.deadline),
    companyName: initialJob?.company?.name ?? '',
    companyWebsite: initialJob?.company?.website ?? '',
    companyLogo: initialJob?.company?.logo ?? '',
    salaryMin: initialJob?.salary?.min ?? '',
    salaryMax: initialJob?.salary?.max ?? '',
    salaryCurrency: initialJob?.salary?.currency ?? 'INR',
    expMin: initialJob?.experience?.min ?? 0,
    expMax: initialJob?.experience?.max ?? '',
    eligibleBatches: Array.isArray(initialJob?.eligibleBatches) ? initialJob.eligibleBatches.join(', ') : '',
    eligiblePrograms: Array.isArray(initialJob?.eligiblePrograms) ? initialJob.eligiblePrograms.join(', ') : '',
    requiredSkills: normalizeSkills(initialJob?.requiredSkills)
  }))

  React.useEffect(() => {
    setForm({
      title: initialJob?.title ?? '',
      description: initialJob?.description ?? '',
      location: initialJob?.location ?? '',
      jobType: initialJob?.jobType ?? 'full-time',
      positions: initialJob?.positions ?? 1,
      minAggregateScore: initialJob?.minAggregateScore ?? 0,
      deadline: toDateTimeLocal(initialJob?.deadline),
      companyName: initialJob?.company?.name ?? '',
      companyWebsite: initialJob?.company?.website ?? '',
      companyLogo: initialJob?.company?.logo ?? '',
      salaryMin: initialJob?.salary?.min ?? '',
      salaryMax: initialJob?.salary?.max ?? '',
      salaryCurrency: initialJob?.salary?.currency ?? 'INR',
      expMin: initialJob?.experience?.min ?? 0,
      expMax: initialJob?.experience?.max ?? '',
      eligibleBatches: Array.isArray(initialJob?.eligibleBatches) ? initialJob.eligibleBatches.join(', ') : '',
      eligiblePrograms: Array.isArray(initialJob?.eligiblePrograms) ? initialJob.eligiblePrograms.join(', ') : '',
      requiredSkills: normalizeSkills(initialJob?.requiredSkills)
    })
  }, [initialJob?._id])

  const update = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }))
  }

  const updateSkill = (idx, key, value) => {
    setForm((p) => {
      const next = [...p.requiredSkills]
      next[idx] = { ...next[idx], [key]: value }
      return { ...p, requiredSkills: next }
    })
  }

  const addSkill = () => {
    setForm((p) => ({ ...p, requiredSkills: [...p.requiredSkills, { name: '', minLevel: '' }] }))
  }

  const removeSkill = (idx) => {
    setForm((p) => {
      const next = p.requiredSkills.filter((_, i) => i !== idx)
      return { ...p, requiredSkills: next.length > 0 ? next : [{ name: '', minLevel: '' }] }
    })
  }

  const buildPayload = () => {
    const requiredSkills = (form.requiredSkills || [])
      .filter((s) => String(s?.name || '').trim())
      .map((s) => ({
        name: String(s.name).trim(),
        minLevel: Number(s.minLevel)
      }))

    const eligibleBatches = String(form.eligibleBatches || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)

    const eligiblePrograms = String(form.eligiblePrograms || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)

    const salary = {}
    if (form.salaryMin !== '' && form.salaryMin !== null) salary.min = Number(form.salaryMin)
    if (form.salaryMax !== '' && form.salaryMax !== null) salary.max = Number(form.salaryMax)
    if (form.salaryCurrency) salary.currency = String(form.salaryCurrency)

    const experience = {}
    if (form.expMin !== '' && form.expMin !== null) experience.min = Number(form.expMin)
    if (form.expMax !== '' && form.expMax !== null) experience.max = Number(form.expMax)

    const payload = {
      title: String(form.title).trim(),
      description: String(form.description).trim(),
      company: {
        name: String(form.companyName).trim(),
        ...(form.companyWebsite ? { website: String(form.companyWebsite).trim() } : {}),
        ...(form.companyLogo ? { logo: String(form.companyLogo).trim() } : {})
      },
      location: String(form.location).trim(),
      jobType: form.jobType,
      positions: Number(form.positions),
      minAggregateScore: Number(form.minAggregateScore),
      requiredSkills,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      ...(Object.keys(salary).some((k) => salary[k] !== undefined) ? { salary } : {}),
      ...(Object.keys(experience).some((k) => experience[k] !== undefined) ? { experience } : {}),
      ...(eligibleBatches.length > 0 ? { eligibleBatches } : {}),
      ...(eligiblePrograms.length > 0 ? { eligiblePrograms } : {})
    }

    return payload
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (readOnly) return
    onSubmit(buildPayload())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
            <input
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              value={form.companyName}
              onChange={(e) => update('companyName', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
            <select
              value={form.jobType}
              onChange={(e) => update('jobType', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={readOnly}
            >
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="internship">Internship</option>
              <option value="contract">Contract</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Positions</label>
            <input
              type="number"
              min={1}
              value={form.positions}
              onChange={(e) => update('positions', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Aggregate Score (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.minAggregateScore}
              onChange={(e) => update('minAggregateScore', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => update('deadline', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Website</label>
            <input
              value={form.companyWebsite}
              onChange={(e) => update('companyWebsite', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://..."
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo URL</label>
            <input
              value={form.companyLogo}
              onChange={(e) => update('companyLogo', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://..."
              disabled={readOnly}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={5}
              required
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Required Skills</h2>
          <button
            type="button"
            onClick={addSkill}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={readOnly}
          >
            Add Skill
          </button>
        </div>

        <div className="space-y-3">
          {(form.requiredSkills || []).map((s, idx) => (
            <div key={`skill-${idx}`} className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-7">
                <input
                  value={s.name}
                  onChange={(e) => updateSkill(idx, 'name', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Skill name"
                  required={idx === 0}
                  disabled={readOnly}
                />
              </div>
              <div className="md:col-span-3">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={s.minLevel}
                  onChange={(e) => updateSkill(idx, 'minLevel', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Min %"
                  required={idx === 0}
                  disabled={readOnly}
                />
              </div>
              <div className="md:col-span-2 flex items-center">
                <button
                  type="button"
                  onClick={() => removeSkill(idx)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={readOnly}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Optional Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salary Min</label>
            <input
              type="number"
              min={0}
              value={form.salaryMin}
              onChange={(e) => update('salaryMin', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salary Max</label>
            <input
              type="number"
              min={0}
              value={form.salaryMax}
              onChange={(e) => update('salaryMax', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salary Currency</label>
            <input
              value={form.salaryCurrency}
              onChange={(e) => update('salaryCurrency', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experience Min (years)</label>
            <input
              type="number"
              min={0}
              value={form.expMin}
              onChange={(e) => update('expMin', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experience Max (years)</label>
            <input
              type="number"
              min={0}
              value={form.expMax}
              onChange={(e) => update('expMax', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Eligible Batches (comma-separated)</label>
            <input
              value={form.eligibleBatches}
              onChange={(e) => update('eligibleBatches', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="2024, 2025"
              disabled={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Eligible Programs (comma-separated)</label>
            <input
              value={form.eligiblePrograms}
              onChange={(e) => update('eligiblePrograms', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="BCA, MCA"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={submitting || readOnly}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (mode === 'edit' ? 'Saving...' : 'Creating...') : (mode === 'edit' ? 'Save Changes' : 'Create Job')}
        </button>
      </div>
    </form>
  )
}

export default JobForm
