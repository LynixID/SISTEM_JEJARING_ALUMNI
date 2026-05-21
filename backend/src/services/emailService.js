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
      subject: `[Pendaftaran Baru] Verifikasi Akun Alumni - ${userData.nama}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
            .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; }
            .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.025em; }
            .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 16px; }
            .content { padding: 40px; }
            .salutation { font-size: 18px; font-weight: 600; color: #1e293b; margin-top: 0; margin-bottom: 16px; }
            .intro-text { color: #475569; font-size: 15px; margin-bottom: 24px; }
            .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
            .info-row:last-child { border-bottom: none; }
            .label { color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
            .value { color: #0f172a; font-size: 14px; font-weight: 500; text-align: right; }
            .btn-container { text-align: center; margin-top: 32px; }
            .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); transition: all 0.2s; }
            .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 13px; border-top: 1px solid #f1f5f9; background-color: #fafafa; }
            .footer p { margin: 4px 0; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>DPW IKA UII JATENG</h1>
                <p>Notifikasi Sistem Jejaring Alumni</p>
              </div>
              <div class="content">
                <h2 class="salutation">Yth. Administrator Jejaring Alumni,</h2>
                <p class="intro-text">Kami ingin menginformasikan bahwa seorang alumni baru telah mendaftar di platform Jejaring Alumni DPW IKA UII JATENG. Pendaftar ini telah sukses menyelesaikan verifikasi alamat email via OTP dan saat ini sedang menunggu tinjauan serta persetujuan akhir dari Administrator.</p>
                
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
                    <span class="label">NIM</span>
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
                    <span class="label">Domisili</span>
                    <span class="value">${userData.domisili || '-'}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Tanggal Daftar</span>
                    <span class="value">${new Date(userData.createdAt).toLocaleString('id-ID')}</span>
                  </div>
                </div>
                
                <div class="btn-container">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/users" class="button">Buka Dashboard Verifikasi</a>
                </div>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} DPW IKA UII JATENG. All rights reserved.</p>
                <p style="color: #cbd5e1; font-size: 11px;">Ini adalah email otomatis dari sistem, mohon tidak membalas email ini.</p>
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

/**
 * Send notification email to user when their account is approved and verified by admin
 */
export const sendUserApprovalEmail = async (email, userData) => {
  try {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Sistem Alumni DPW IKA UII JATENG'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Selamat! Akun Jejaring Alumni Anda Telah Aktif - DPW IKA UII JATENG',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
            .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; }
            .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.025em; }
            .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 16px; }
            .content { padding: 40px; }
            .salutation { font-size: 18px; font-weight: 600; color: #1e293b; margin-top: 0; margin-bottom: 16px; }
            .intro-text { color: #475569; font-size: 15px; margin-bottom: 24px; }
            .features-list { background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 12px; padding: 24px 24px 24px 40px; margin: 24px 0; }
            .features-list li { color: #1e40af; font-size: 14px; margin-bottom: 10px; font-weight: 500; }
            .features-list li strong { color: #1e3a8a; }
            .features-list li:last-child { margin-bottom: 0; }
            .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
            .info-row:last-child { border-bottom: none; }
            .label { color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
            .value { color: #0f172a; font-size: 14px; font-weight: 500; text-align: right; }
            .btn-container { text-align: center; margin-top: 32px; }
            .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); transition: all 0.2s; }
            .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 13px; border-top: 1px solid #f1f5f9; background-color: #fafafa; }
            .footer p { margin: 4px 0; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>DPW IKA UII JATENG</h1>
                <p>Sistem Jejaring Alumni</p>
              </div>
              <div class="content">
                <h2 class="salutation">Yth. Rekan Alumni ${userData.nama},</h2>
                <p class="intro-text">Kabar baik! Proses verifikasi profil Anda telah selesai dilakukan. Tim Administrator DPW IKA UII JATENG telah meninjau data pendaftaran Anda dan secara resmi telah <strong>mengaktifkan akun Anda</strong> dalam platform Sistem Jejaring Alumni.</p>
                
                <p class="intro-text">Dengan aktifnya akun ini, Anda kini memiliki akses penuh untuk menjelajahi platform dan terhubung kembali dengan rekan-rekan alumni se-Jawa Tengah. Nikmati berbagai kemudahan dan fitur unggulan yang tersedia:</p>
                
                <ul class="features-list">
                  <li><strong>Jejaring Sosial Alumni:</strong> Cari, temukan, dan jalin kembali silaturahmi erat dengan sesama alumni UII lintas angkatan dan program studi.</li>
                  <li><strong>Informasi Karir & Loker:</strong> Akses lowongan pekerjaan eksklusif atau bagikan peluang karir/bisnis bagi sesama alumni.</li>
                  <li><strong>Agenda & Acara Resmi:</strong> Ikuti berbagai agenda menarik, reuni, webinar, serta pengumuman resmi terbaru dari pengurus wilayah.</li>
                  <li><strong>Forum & Grup Diskusi:</strong> Saling bertukar wawasan dan berkolaborasi dalam forum diskusi tematik yang interaktif.</li>
                </ul>

                <div class="info-box">
                  <div class="info-row">
                    <span class="label">Nama Lengkap</span>
                    <span class="value">${userData.nama}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Alamat Email</span>
                    <span class="value">${email}</span>
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
                    <span class="label">Status Akun</span>
                    <span class="value" style="color: #16a34a; font-weight: 600;">Aktif & Terverifikasi</span>
                  </div>
                </div>
                
                <div class="btn-container">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="button">Mulai Jejaring Platform</a>
                </div>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} DPW IKA UII JATENG. All rights reserved.</p>
                <p style="color: #cbd5e1; font-size: 11px;">Ini adalah email otomatis dari sistem, mohon tidak membalas email ini.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('User approval email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending user approval email:', error)
    throw new Error('Gagal mengirim email verifikasi ke user')
  }
}


