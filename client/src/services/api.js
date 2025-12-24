import axios from 'axios'
import toast from 'react-hot-toast'

// Create axios instance
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post('/api/v1/auth/refresh', {
            refreshToken
          })

          if (response.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data
            localStorage.setItem('accessToken', accessToken)
            localStorage.setItem('refreshToken', newRefreshToken)
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return api(originalRequest)
          }
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: (data) => api.post('/auth/logout', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  changePassword: (data) => api.post('/auth/change-password', data),
  getProfile: () => api.get('/auth/me'),
}

// Users API
export const usersAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  updateStudentProfile: (data) => api.put('/users/me/student-profile', data),
  getUserById: (id) => api.get(`/users/id/${id}`),
  getUsers: (params) => api.get('/users', { params }),
  updateUserStatus: (id, data) => api.put(`/users/${id}/status`, data),
  getApprovedTrainersPublic: () => api.get('/users/public/trainers'),
}

// Students API
export const studentsAPI = {
  getStudents: (params) => api.get('/students', { params }),
  getStudentById: (id) => api.get(`/students/${id}`),
  addTest: (id, data) => api.post(`/students/${id}/tests`, data),
  addEvaluation: (id, data) => api.post(`/students/${id}/evaluations`, data),
  addRemark: (id, data) => api.post(`/students/${id}/remarks`, data),
  approveStudent: (id, data) => api.put(`/students/${id}/approve`, data),
  getStats: () => api.get('/students/stats/overview'),
  getMyPerformance: () => api.get('/students/me/performance'),
  getMyPerformanceLatest: () => api.get('/students/me/performance/latest'),
  getMyPerformanceAlerts: (params) => api.get('/students/me/performance/alerts', { params }),
}

// Jobs API
export const jobsAPI = {
  getJobs: (params) => api.get('/jobs', { params }),
  getJobById: (id) => api.get(`/jobs/${id}`),
  createJob: (data) => api.post('/jobs', data),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  getMatches: (id, params) => api.get(`/jobs/${id}/matches`, { params }),
  shortlistStudents: (id, data) => api.post(`/jobs/${id}/shortlist`, data),
  closeJob: (id) => api.put(`/jobs/${id}/close`),
  applyForJob: (id) => api.post(`/jobs/${id}/apply`),
  explainMatch: (jobId, studentId) => api.get(`/jobs/${jobId}/explain/${studentId}`),
}

// Trainers API
export const trainersAPI = {
  getTrainers: (params) => api.get('/trainers', { params }),
  getTrainerById: (id) => api.get(`/trainers/${id}`),
  getTrainerStudents: (trainerId, params) => api.get(`/trainers/${trainerId}/students`, { params }),
  getTrainerAnalytics: (trainerId) => api.get(`/trainers/${trainerId}/analytics`),
  getPendingStudents: () => api.get('/trainers/me/students/pending'),
  updateStudentApproval: (studentProfileId, status) =>
    api.put(`/trainers/me/students/${studentProfileId}/approval`, { status }),
  getStudentEvaluations: (studentProfileId, params) =>
    api.get(`/trainers/me/students/${studentProfileId}/evaluations`, { params }),
  recordEvaluation: (studentProfileId, data) =>
    api.post(`/trainers/me/students/${studentProfileId}/evaluations`, data),
  updateEvaluation: (evaluationId, data) =>
    api.put(`/trainers/me/evaluations/${evaluationId}`, data),
  getStudentAnalytics: (params) =>
    api.get('/trainers/me/students/analytics', { params }),
}

// Notifications API
export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (data) => api.post('/notifications/mark-read', data),
  markSingleAsRead: (id) => api.put(`/notifications/${id}/read`),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getRecent: () => api.get('/notifications/recent'),
}

// Reports API
export const reportsAPI = {
  getPlacementStats: () => api.get('/reports/placement-stats'),
  getTrainerPerformance: () => api.get('/reports/trainer-performance'),
  getSkillsAnalysis: () => api.get('/reports/skills-analysis'),
  exportStudents: (params) => api.get('/reports/export/students', { 
    params,
    responseType: 'blob'
  }),
  getDashboardSummary: () => api.get('/reports/dashboard-summary'),
}

// Error handler utility
export const handleAPIError = (error, defaultMessage = 'An error occurred') => {
  const message = error.response?.data?.error || error.message || defaultMessage
  toast.error(message)
  return message
}

export default api
