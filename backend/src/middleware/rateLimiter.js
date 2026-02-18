import rateLimit from 'express-rate-limit'

// Rate limiter untuk request OTP (prevent spam)
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 3, // Maksimal 3 request per 15 menit per IP
  message: {
    error: 'Terlalu banyak request OTP. Silakan coba lagi setelah 15 menit.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Terlalu banyak request OTP. Silakan coba lagi setelah 15 menit.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000) // seconds
    })
  }
})

// Rate limiter untuk verify OTP (prevent brute force)
export const verifyOTPRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // Maksimal 10 percobaan per 15 menit per IP
  message: {
    error: 'Terlalu banyak percobaan verifikasi OTP. Silakan coba lagi setelah 15 menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Terlalu banyak percobaan verifikasi OTP. Silakan coba lagi setelah 15 menit.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    })
  }
})

// Rate limiter untuk login (prevent brute force)
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Maksimal 5 percobaan login per 15 menit per IP
  message: {
    error: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    })
  }
})

