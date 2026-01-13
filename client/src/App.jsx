import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import LoadingSpinner from './components/UI/LoadingSpinner'

// Public pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'

// Student pages
import StudentDashboard from './pages/Student/StudentDashboard'
import StudentProfile from './pages/Student/StudentProfile'
import MyPerformance from './pages/Student/MyPerformance'
import JobMatches from './pages/Student/JobMatches'
import JobDetails from './pages/Student/JobDetails'

// Trainer pages
import TrainerDashboard from './pages/Trainer/TrainerDashboard'
import StudentList from './pages/Trainer/StudentList'
import StudentDetail from './pages/Trainer/StudentDetail'
import TrainerAnalytics from './pages/Trainer/TrainerAnalytics'
import TrainerEvaluation from './pages/Trainer/TrainerEvaluation'

// Coordinator pages
import CoordinatorDashboard from './pages/Coordinator/CoordinatorDashboard'
import CreateJob from './pages/Coordinator/CreateJob'
import Reports from './pages/Coordinator/Reports'

// Shared pages
import NotificationsPage from './pages/NotificationsPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          {/* Dashboard routes - role-based */}
          <Route path="dashboard/*" element={
            user?.role === 'student' ? <StudentDashboard /> :
            user?.role === 'trainer' ? <TrainerDashboard /> :
            user?.role === 'coordinator' || user?.role === 'admin' ? <CoordinatorDashboard /> :
            <Navigate to="/login" replace />
          } />

          {/* Student routes */}
          <Route path="profile" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentProfile />
            </ProtectedRoute>
          } />
          <Route path="students/performance" element={
            <ProtectedRoute allowedRoles={['student']}>
              <MyPerformance />
            </ProtectedRoute>
          } />
          <Route path="jobs" element={
            <ProtectedRoute allowedRoles={['student']}>
              <JobMatches />
            </ProtectedRoute>
          } />
          <Route path="jobs/:id" element={
            <ProtectedRoute allowedRoles={['student']}>
              <JobDetails />
            </ProtectedRoute>
          } />

          {/* Trainer routes */}
          <Route path="students" element={
            <ProtectedRoute allowedRoles={['trainer', 'coordinator']}>
              <StudentList />
            </ProtectedRoute>
          } />
          <Route path="students/:id" element={
            <ProtectedRoute allowedRoles={['trainer', 'coordinator']}>
              <StudentDetail />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute allowedRoles={['trainer', 'coordinator']}>
              <TrainerAnalytics />
            </ProtectedRoute>
          } />
          <Route path="/evaluations" element={
            <ProtectedRoute allowedRoles={['trainer']}>
              <TrainerEvaluation />
            </ProtectedRoute>
          } />

          {/* Coordinator routes */}
          <Route path="student-management" element={
            <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
              <Navigate to="/dashboard/student-management" replace />
            </ProtectedRoute>
          } />
          <Route path="job-management" element={
            <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
              <Navigate to="/dashboard/job-management" replace />
            </ProtectedRoute>
          } />
          <Route path="jobs/create" element={
            <ProtectedRoute allowedRoles={['coordinator']}>
              <CreateJob />
            </ProtectedRoute>
          } />
          <Route path="reports" element={
            <ProtectedRoute allowedRoles={['coordinator']}>
              <Reports />
            </ProtectedRoute>
          } />

          <Route path="placement-requests" element={
            <ProtectedRoute allowedRoles={['coordinator', 'admin']}>
              <Navigate to="/dashboard/placement-requests" replace />
            </ProtectedRoute>
          } />

          {/* Shared routes */}
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* 404 page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

export default App
