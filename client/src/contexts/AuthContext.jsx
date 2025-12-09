import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

// Initial state
const initialState = {
  user: null,
  loading: true,
  isAuthenticated: false,
}

// Action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
}

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      }
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
      }
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
      }
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      }
    default:
      return state
  }
}

// Create context
const AuthContext = createContext()

// Auth provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
        return
      }

      const response = await authAPI.getProfile()
      if (response.data.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: response.data.data }
        })
      } else {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
    }
  }

  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      
      const response = await authAPI.login(credentials)
      
      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data.data
        
        // Store tokens
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user }
        })
        
        toast.success(`Welcome back, ${user.name.first}!`)
        return { success: true }
      } else {
        throw new Error(response.data.error || 'Login failed')
      }
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
      const errorMessage = error.response?.data?.error || error.message || 'Login failed'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      
      const response = await authAPI.register(userData)
      
      if (response.data.success) {
        // Registration succeeded: do not auto-login or store tokens.
        // Simply stop loading and let the UI redirect to the login page.
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })

        if (userData.role === 'trainer') {
          toast.success('Registered successfully. Please wait for admin approval.')
        } else {
          toast.success('Your account has been created. Please log in to continue.')
        }
        return { success: true }
      } else {
        throw new Error(response.data.error || 'Registration failed')
      }
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await authAPI.logout({ refreshToken })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage and state regardless of API call success
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
      toast.success('Logged out successfully')
    }
  }

  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData
    })
  }

  const changePassword = async (passwordData) => {
    try {
      const response = await authAPI.changePassword(passwordData)
      
      if (response.data.success) {
        toast.success('Password changed successfully')
        return { success: true }
      } else {
        throw new Error(response.data.error || 'Password change failed')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Password change failed'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    changePassword,
    checkAuthStatus,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
