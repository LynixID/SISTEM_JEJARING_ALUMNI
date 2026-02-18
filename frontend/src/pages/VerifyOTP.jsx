import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import Card from '../components/common/Card'

const VerifyOTP = () => {
  const { verifyOTPAndRegister, resendOTP, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { email, userData, expiresIn = 10 } = location.state || {}

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(expiresIn * 60) // Convert to seconds
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (!email || !userData) {
      navigate('/register')
      return
    }

    // Countdown timer
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft, email, userData, navigate])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return // Only numbers

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Only take last character

    setOtp(newOtp)
    setError('')

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''))
    setOtp(newOtp)
    
    // Focus last input
    const lastIndex = Math.min(pastedData.length, 5)
    const lastInput = document.getElementById(`otp-${lastIndex}`)
    if (lastInput) lastInput.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('OTP harus 6 digit')
      setLoading(false)
      return
    }

    const result = await verifyOTPAndRegister(email, otpCode, userData)

    if (result.success) {
      // Auto login sudah dilakukan di verifyOTPAndRegister
      // Redirect ke halaman menunggu verifikasi admin
      navigate('/waiting-verification', { replace: true })
    } else {
      setError(result.message || 'OTP tidak valid')
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return

    setResendLoading(true)
    setError('')
    
    const result = await resendOTP(email)

    if (result.success) {
      setOtp(['', '', '', '', '', ''])
      setTimeLeft(result.expiresIn * 60)
      setCanResend(false)
      setResendLoading(false)
    } else {
      setError(result.message || 'Gagal mengirim ulang OTP')
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Verifikasi Email</h2>
          <p className="mt-2 text-sm text-gray-600">
            Kami telah mengirimkan kode OTP ke <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Masukkan kode OTP (6 digit)
            </label>
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                  required
                />
              ))}
            </div>
          </div>

          <div className="text-center">
            {timeLeft > 0 ? (
              <p className="text-sm text-gray-600">
                Kode berlaku selama: <span className="font-semibold text-blue-600">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="text-sm text-red-600 mb-2">Kode OTP sudah kadaluarsa</p>
            )}
            
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend || resendLoading}
              className={`text-sm ${
                canResend
                  ? 'text-blue-600 hover:text-blue-700 font-medium'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              {resendLoading ? 'Mengirim...' : 'Kirim ulang OTP'}
            </button>
          </div>

          <Button type="submit" className="w-full" disabled={loading || otp.join('').length !== 6}>
            {loading ? 'Memverifikasi...' : 'Verifikasi'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              Kembali ke halaman registrasi
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default VerifyOTP

