import transporter from '../../config/email.js'
import prisma from '../../config/database.js'

// Simple in-memory rate limiter (Key: IP, Value: Timestamp)
const emailRateLimits = new Map()

// Send contact email
export const sendContactEmail = async (req, res) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip'
    const now = Date.now()
    const cooldown = 10 * 60 * 1000 // 10 minutes

    if (emailRateLimits.has(ip)) {
      const lastSent = emailRateLimits.get(ip)
      const timeDiff = now - lastSent
      if (timeDiff < cooldown) {
        const minutesLeft = Math.ceil((cooldown - timeDiff) / (60 * 1000))
        return res.status(429).json({
          success: false,
          message: `Anda baru saja mengirim pesan. Silakan coba lagi dalam ${minutesLeft} menit.`
        })
      }
    }

    const { name, email, message, to } = req.body
    const subject = 'Pesan Dari Landing Pages UII Connect'

    // Validasi
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi'
      })
    }

    // Ambil email tujuan dari database jika tidak disediakan
    let recipientEmail = to
    if (!recipientEmail) {
      const emailItem = await prisma.displayHomePage.findFirst({
        where: { kategori: 'EMAIL', isActive: true }
      })
      recipientEmail = emailItem?.value || process.env.EMAIL_USER || 'info@ikauiijateng.org'
    }

    // Kirim email
    const mailOptions = {
      from: `"${name} via IKA UII JATENG" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: recipientEmail,
      replyTo: email,
      subject: `[Kontak Website] ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a202c; margin: 0; padding: 0; background-color: #f7fafc; }
            .wrapper { width: 100%; table-layout: fixed; background-color: #f7fafc; padding-bottom: 40px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
            .content { padding: 30px; }
            .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; }
            .info-row:last-child { border-bottom: none; }
            .label { color: #64748b; font-size: 14px; font-weight: 600; }
            .value { color: #1e293b; font-size: 14px; font-weight: 500; }
            .message-box { background-color: #eff6ff; border-left: 4px solid #667eea; padding: 20px; border-radius: 0 8px 8px 0; margin: 20px 0; }
            .message-text { color: #1e293b; font-size: 14px; white-space: pre-wrap; }
            .footer { text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>Pesan Baru dari Website IKA UII JATENG</h1>
              </div>
              <div class="content">
                <p>Anda收到一封新邮件来自网站联系表单。以下是详细信息：</p>

                <div class="info-box">
                  <div class="info-row">
                    <span class="label">Nama Pengirim</span>
                    <span class="value">${name}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Email</span>
                    <span class="value"><a href="mailto:${email}">${email}</a></span>
                  </div>
                  <div class="info-row">
                    <span class="label">Subjek</span>
                    <span class="value">${subject}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Waktu</span>
                    <span class="value">${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</span>
                  </div>
                </div>

                <div class="message-box">
                  <div class="label" style="margin-bottom: 10px;">Isi Pesan:</div>
                  <div class="message-text">${message}</div>
                </div>

                <p style="color: #718096; font-size: 13px;">
                  Balas email ini langsung ke ${email} untuk merespons pengirim.
                </p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} IKA UII JATENG. All rights reserved.</p>
                <p>Pesan ini dikirim melalui formulir kontak di website.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Contact email sent:', info.messageId)

    // Set rate limit for this IP on successful send
    emailRateLimits.set(ip, now)

    res.json({
      success: true,
      message: 'Pesan berhasil terkirim'
    })
  } catch (error) {
    console.error('Error sending contact email:', error)
    res.status(500).json({
      success: false,
      message: 'Gagal mengirim pesan. Silakan coba lagi.',
      error: error.message
    })
  }
}