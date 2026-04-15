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
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a202c; margin: 0; padding: 0; background-color: #f7fafc; }
            .wrapper { width: 100%; table-layout: fixed; background-color: #f7fafc; padding-bottom: 40px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
            .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
            .content { padding: 40px; }
            .otp-container { background-color: #eff6ff; border: 2px solid #dbeafe; padding: 32px; text-align: center; margin: 32px 0; border-radius: 12px; }
            .otp-label { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #1e40af; font-weight: 600; margin-bottom: 12px; }
            .otp-code { font-size: 38px; font-weight: 800; color: #1e40af; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace; }
            .footer { text-align: center; padding: 20px; color: #718096; font-size: 13px; }
            .warning { background-color: #fffaf0; border-left: 4px solid #ed8936; padding: 20px; margin: 24px 0; border-radius: 8px; font-size: 14px; }
            .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.2s; }
            .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; }
            .info-row:last-child { border-bottom: none; }
            .label { color: #64748b; font-size: 14px; font-weight: 500; }
            .value { color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>DPW IKA UII JATENG</h1>
                <p style="margin-top: 8px; opacity: 0.9;">Sistem Jejaring Alumni</p>
              </div>
              <div class="content">
                <h2 style="margin-top: 0; color: #1e293b;">Halo,</h2>
                <p>Terima kasih telah mendaftar di Sistem Jejaring Alumni. Gunakan kode keamanan di bawah ini untuk memverifikasi akun Anda:</p>
                
                <div class="otp-container">
                  <div class="otp-label">Kode Verifikasi</div>
                  <div class="otp-code">${otp}</div>
                </div>
                
                <div class="warning">
                  <strong>⚠️ Penting:</strong>
                  <p style="margin: 8px 0 0 0;">Kode ini hanya berlaku selama <strong>10 menit</strong>. Mohon tidak membagikan kode ini kepada pihak mana pun demi keamanan akun Anda.</p>
                </div>
                
                <p style="color: #4a5568; font-size: 14px;">Jika Anda tidak merasa melakukan pendaftaran ini, silakan abaikan email ini.</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} DPW IKA UII JATENG. All rights reserved.</p>
              </div>
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
      subject: 'Pendaftaran User Baru - DPW IKA UII JATENG',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a202c; margin: 0; padding: 0; background-color: #f7fafc; }
            .wrapper { width: 100%; table-layout: fixed; background-color: #f7fafc; padding-bottom: 40px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
            .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
            .content { padding: 40px; }
            .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; }
            .info-row { padding: 12px 0; border-bottom: 1px solid #edf2f7; }
            .info-row:last-child { border-bottom: none; }
            .label { color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 4px; }
            .value { color: #1e293b; font-size: 16px; font-weight: 500; }
            .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin-top: 20px; text-align: center; }
            .footer { text-align: center; padding: 20px; color: #718096; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>Notifikasi Admin</h1>
                <p>Pendaftaran Alumni Baru</p>
              </div>
              <div class="content">
                <h2 style="margin-top: 0; color: #1e293b;">Halo Admin,</h2>
                <p>Pengguna baru telah mendaftar dan memerlukan verifikasi:</p>
                
                <div class="info-box">
                  <div class="info-row">
                    <span class="label">Nama Lengkap</span>
                    <span class="value">${userData.nama}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Email</span>
                    <span class="value">${userData.email}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">NIM / No. Anggota</span>
                    <span class="value">${userData.nim || '-'}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Program Studi</span>
                    <span class="value">${userData.prodi || '-'}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Angkatan</span>
                    <span class="value">${userData.angkatan || '-'}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Tanggal Daftar</span>
                    <span class="value">${new Date(userData.createdAt).toLocaleString('id-ID')}</span>
                  </div>
                </div>
                
                <div style="text-align: center;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/users" class="button">Buka Dashboard Verifikasi</a>
                </div>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} DPW IKA UII JATENG. All rights reserved.</p>
              </div>
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


