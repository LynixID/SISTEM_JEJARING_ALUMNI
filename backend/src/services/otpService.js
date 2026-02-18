import otpGenerator from 'otp-generator'

/**
 * Generate 6-digit OTP
 */
export const generateOTP = () => {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false
  })
}

/**
 * Check if OTP is expired
 */
export const isOTPExpired = (otpExpiry) => {
  if (!otpExpiry) return true
  return new Date() > new Date(otpExpiry)
}

/**
 * Create OTP expiry time (10 minutes from now)
 */
export const createOTPExpiry = () => {
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10')
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + expiryMinutes)
  return expiry
}

/**
 * Verify OTP
 */
export const verifyOTP = (storedOTP, inputOTP, otpExpiry) => {
  // Convert to string and trim whitespace
  const cleanStored = String(storedOTP || '').trim()
  const cleanInput = String(inputOTP || '').trim()

  if (!cleanStored || !cleanInput) {
    return { valid: false, message: 'OTP tidak ditemukan' }
  }

  if (isOTPExpired(otpExpiry)) {
    return { valid: false, message: 'OTP sudah kadaluarsa' }
  }

  // Compare as strings (case-sensitive, but OTP is numeric)
  if (cleanStored !== cleanInput) {
    console.log('OTP Mismatch:', {
      stored: cleanStored,
      input: cleanInput,
      storedLength: cleanStored.length,
      inputLength: cleanInput.length
    })
    return { valid: false, message: 'OTP tidak valid' }
  }

  return { valid: true, message: 'OTP valid' }
}

