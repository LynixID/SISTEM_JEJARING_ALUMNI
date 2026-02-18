import transporter from '../config/email.js'

/**
 * Send OTP email to user
 */
export const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Sistem Alumni DPW IKA UII JATENG'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Kode Verifikasi Email - Sistem Alumni DPW IKA UII JATENG',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Sistem Alumni DPW IKA UII JATENG</h1>
              <p>Verifikasi Email Anda</p>
            </div>
            <div class="content">
              <h2>Halo,</h2>
              <p>Terima kasih telah mendaftar di Sistem Jejaring Alumni DPW IKA UII JATENG.</p>
              <p>Gunakan kode OTP berikut untuk verifikasi email Anda:</p>
              
              <div class="otp-box">
                <p style="margin: 0 0 10px 0; color: #666;">Kode Verifikasi</p>
                <div class="otp-code">${otp}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Penting:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Kode ini berlaku selama <strong>10 menit</strong></li>
                  <li>Jangan bagikan kode ini kepada siapapun</li>
                  <li>Jika Anda tidak meminta kode ini, abaikan email ini</li>
                </ul>
              </div>
              
              <p>Jika Anda tidak meminta kode verifikasi ini, silakan abaikan email ini.</p>
            </div>
            <div class="footer">
              <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
              <p>&copy; ${new Date().getFullYear()} Sistem Alumni DPW IKA UII JATENG</p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('OTP email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending OTP email:', error)
    throw new Error('Gagal mengirim email OTP')
  }
}

/**
 * Send notification email to admin about new user registration
 */
export const sendAdminNotificationEmail = async (adminEmail, userData) => {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Sistem Alumni DPW IKA UII JATENG'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: 'Pendaftaran User Baru - Sistem Alumni DPW IKA UII JATENG',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #666; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Notifikasi Admin</h1>
              <p>Pendaftaran User Baru</p>
            </div>
            <div class="content">
              <h2>Halo Admin,</h2>
              <p>Ada pendaftaran user baru yang perlu diverifikasi:</p>
              
              <div class="info-box">
                <div class="info-row">
                  <span class="label">Nama:</span> ${userData.nama}
                </div>
                <div class="info-row">
                  <span class="label">Email:</span> ${userData.email}
                </div>
                <div class="info-row">
                  <span class="label">NIM:</span> ${userData.nim || '-'}
                </div>
                <div class="info-row">
                  <span class="label">Program Studi:</span> ${userData.prodi || '-'}
                </div>
                <div class="info-row">
                  <span class="label">Angkatan:</span> ${userData.angkatan || '-'}
                </div>
                <div class="info-row">
                  <span class="label">Domisili:</span> ${userData.domisili || '-'}
                </div>
                <div class="info-row">
                  <span class="label">Tanggal Daftar:</span> ${new Date(userData.createdAt).toLocaleString('id-ID')}
                </div>
              </div>
              
              <p>Silakan login ke dashboard admin untuk memverifikasi user ini.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/users" class="button">Buka Dashboard Admin</a>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Admin notification email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending admin notification email:', error)
    throw new Error('Gagal mengirim email notifikasi ke admin')
  }
}


