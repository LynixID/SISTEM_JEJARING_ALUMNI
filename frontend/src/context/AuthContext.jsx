import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  // Cek apakah user sudah login saat app pertama kali load
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')

      if (token && savedUser) {
        try {
          // Verifikasi token masih valid dengan backend
          const response = await api.get('/auth/me')
          setUser(response.data.user)
          setIsAuthenticated(true)
          localStorage.setItem('user', JSON.stringify(response.data.user))
        } catch (error) {
          console.error('Auth check failed:', error)
          clearAuth()
        }
      } else {
        clearAuth()
      }
    } catch (error) {
      console.error('Error in checkAuth:', error)
      clearAuth()
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh user data (untuk update setelah edit profile)
  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  // Fungsi login: kirim email & password ke backend, simpan token jika berhasil
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      
      const { token, user } = response.data
      
      // Simpan token dan user data ke localStorage
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      // Update state global
      setUser(user)
      setIsAuthenticated(true)
      
      return { success: true, user }
    } catch (error) {
      const message = error.response?.data?.error || 'Email atau password salah'
      return { success: false, message }
    }
  }

  const requestOTP = async (email) => {
    try {
      const response = await api.post('/auth/register/request-otp', { email })
      return { success: true, message: response.data.message, expiresIn: response.data.expiresIn }
    } catch (error) {
      const message = error.response?.data?.error || 'Gagal mengirim OTP'
      return { success: false, message }
    }
  }

  const verifyOTPAndRegister = async (email, otp, userData) => {
    try {
      const response = await api.post('/auth/register/verify-otp', {
        email,
        otp,
        ...userData
      })
      
      // Auto login jika token tersedia
      if (response.data.token && response.data.user) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        setUser(response.data.user)
        setIsAuthenticated(true)
      }
      
      return { 
        success: true, 
        message: response.data.message, 
        user: response.data.user,
        token: response.data.token
      }
    } catch (error) {
      // Handle validation errors
      let message = 'Gagal verifikasi OTP'
      if (error.response?.data?.error) {
        message = error.response.data.error
      } else if (error.response?.data?.errors) {
        // If multiple validation errors
        const errors = error.response.data.errors
        if (Array.isArray(errors)) {
          message = errors.map(err => err.msg || err.message).join(', ')
        }
      }
      return { success: false, message }
    }
  }

  const resendOTP = async (email) => {
    try {
      const response = await api.post('/auth/register/resend-otp', { email })
      return { success: true, message: response.data.message, expiresIn: response.data.expiresIn }
    } catch (error) {
      const message = error.response?.data?.error || 'Gagal mengirim ulang OTP'
      return { success: false, message }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      return { success: true, message: response.data.message }
    } catch (error) {
      const message = error.response?.data?.error || 'Terjadi kesalahan saat registrasi'
      return { success: false, message }
    }
  }

  const logout = () => {
    clearAuth()
  }

  const clearAuth = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    requestOTP,
    verifyOTPAndRegister,
    resendOTP,
    logout,
    checkAuth,
    refreshUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

