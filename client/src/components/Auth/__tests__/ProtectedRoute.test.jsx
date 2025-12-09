import React from 'react'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ProtectedRoute from '../ProtectedRoute'
import { useAuth } from '../../../contexts/AuthContext'

// Mock the useAuth hook
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}))

// Mock LoadingSpinner component
jest.mock('../../UI/LoadingSpinner', () => {
  return function LoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>
  }
})

const MockComponent = () => <div data-testid="protected-content">Protected Content</div>

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading spinner when loading', () => {
    useAuth.mockReturnValue({
      user: null,
      loading: true,
      isAuthenticated: false
    })

    renderWithRouter(
      <ProtectedRoute>
        <MockComponent />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('renders children when user is authenticated', () => {
    useAuth.mockReturnValue({
      user: { _id: '1', name: { first: 'John', last: 'Doe' }, role: 'student' },
      loading: false,
      isAuthenticated: true
    })

    renderWithRouter(
      <ProtectedRoute>
        <MockComponent />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
  })

  it('redirects to login when user is not authenticated', () => {
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false
    })

    renderWithRouter(
      <ProtectedRoute>
        <MockComponent />
      </ProtectedRoute>
    )

    // Since we're using Navigate component, the protected content should not be rendered
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('renders children when user has allowed role', () => {
    useAuth.mockReturnValue({
      user: { _id: '1', name: { first: 'John', last: 'Doe' }, role: 'student' },
      loading: false,
      isAuthenticated: true
    })

    renderWithRouter(
      <ProtectedRoute allowedRoles={['student', 'trainer']}>
        <MockComponent />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('shows access denied when user role is not allowed', () => {
    useAuth.mockReturnValue({
      user: { _id: '1', name: { first: 'John', last: 'Doe' }, role: 'student' },
      loading: false,
      isAuthenticated: true
    })

    renderWithRouter(
      <ProtectedRoute allowedRoles={['coordinator']}>
        <MockComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('allows access when no role restrictions are specified', () => {
    useAuth.mockReturnValue({
      user: { _id: '1', name: { first: 'John', last: 'Doe' }, role: 'student' },
      loading: false,
      isAuthenticated: true
    })

    renderWithRouter(
      <ProtectedRoute>
        <MockComponent />
      </ProtectedRoute>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })
})
