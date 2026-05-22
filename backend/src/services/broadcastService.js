import prisma from '../config/database.js'
import transporter from '../config/email.js'

/**
 * Queue announcement emails for all eligible users
 */
export const queueAnnouncementBroadcast = async (announcement) => {
  try {
    // Find all users who are verified and have opted in for email notifications
    const users = await prisma.user.findMany({
      where: {
        verified: true,
        emailVerified: true,
        allowEmailNotification: true,
        isSuspended: false
      },
      select: {
        id: true,
        email: true,
        nama: true
      }
    })

    if (users.length === 0) return 0

    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>[Pengumuman] ${announcement.title}</title>
        <style>
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
          .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 40px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.025em; }
          .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 16px; font-weight: 500; }
          .content { padding: 40px 32px; }
          .salutation { font-size: 18px; font-weight: 600; color: #1e293b; margin-top: 0; margin-bottom: 16px; }
          .intro-text { color: #475569; font-size: 15px; margin-bottom: 24px; }
          .announcement-card { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 24px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
          .announcement-badge { display: inline-block; background-color: #eff6ff; color: #1e40af; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
          .announcement-body { padding: 28px; }
          .announcement-title { margin-top: 0; margin-bottom: 12px; color: #1e3a8a; font-size: 22px; font-weight: 700; line-height: 1.3; }
          .announcement-content { color: #334155; font-size: 15px; line-height: 1.7; word-wrap: break-word; }
          .announcement-meta { margin-top: 20px; padding-top: 16px; border-top: 1px dashed #e2e8f0; }
          .meta-item { display: inline-block; font-size: 13px; color: #64748b; margin-right: 16px; }
          .button-container { text-align: center; margin-top: 32px; }
          .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); transition: all 0.2s; }
          .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 13px; border-top: 1px solid #f1f5f9; background-color: #fafafa; }
          .footer p { margin: 4px 0; }
          .unsubscribe { color: #2563eb; text-decoration: none; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>Kabar Alumni Terbaru</h1>
              <p>DPW IKA UII JATENG</p>
            </div>
            <div class="content">
              <h2 class="salutation">Halo {{NAME}},</h2>
              <p class="intro-text">Kami ingin menginformasikan kabar terbaru dari pengurus wilayah DPW IKA UII JATENG. Berikut adalah rincian informasi terbaru yang dapat Anda ikuti:</p>
              
              <div class="announcement-card">
                <div class="announcement-body">
                  <span class="announcement-badge">📢 Pengumuman</span>
                  <h3 class="announcement-title">${announcement.title}</h3>
                  <div class="announcement-content">
                    ${announcement.content}
                  </div>
                  <div class="announcement-meta">
                    <span class="meta-item">📅 Diterbitkan: ${new Date(announcement.createdAt || new Date()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
              
              <div class="button-container">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/berita/${announcement.slug}" class="button">Lihat Selengkapnya di Website</a>
              </div>
            </div>
            <div class="footer">
              <p>Email ini dikirim karena Anda terdaftar di Sistem Jejaring Alumni DPW IKA UII JATENG.</p>
              <p>Ingin mengatur notifikasi? <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/profil" class="unsubscribe">Klik di sini</a></p>
              <p>&copy; ${new Date().getFullYear()} DPW IKA UII JATENG. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    // Create queue entries in bulk
    const queueData = users.map(user => ({
      userId: user.id,
      subject: `[Pengumuman] ${announcement.title}`,
      content: template.replace('{{NAME}}', user.nama),
      status: 'PENDING'
    }))

    // Prisma createMany is efficient for this
    const result = await prisma.mailQueue.createMany({
      data: queueData,
      skipDuplicates: true
    })

    console.log(`Queued ${result.count} emails for announcement: ${announcement.title}`)
    return result.count
  } catch (error) {
    console.error('Error queueing broadcast:', error)
    throw error
  }
}

/**
 * Queue event emails for all eligible users
 */
export const queueEventBroadcast = async (event) => {
  try {
    // Find all users who are verified and have opted in for email notifications
    const users = await prisma.user.findMany({
      where: {
        verified: true,
        emailVerified: true,
        allowEmailNotification: true,
        isSuspended: false
      },
      select: {
        id: true,
        email: true,
        nama: true
      }
    })

    if (users.length === 0) return 0

    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>[Event Baru] ${event.title}</title>
        <style>
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
          .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 40px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.025em; }
          .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 16px; font-weight: 500; }
          .content { padding: 40px 32px; }
          .salutation { font-size: 18px; font-weight: 600; color: #1e293b; margin-top: 0; margin-bottom: 16px; }
          .intro-text { color: #475569; font-size: 15px; margin-bottom: 24px; }
          .event-card { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 24px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
          .event-badge { display: inline-block; background-color: #fff7ed; color: #c2410c; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
          .event-body { padding: 28px; }
          .event-title { margin-top: 0; margin-bottom: 12px; color: #1e3a8a; font-size: 22px; font-weight: 700; line-height: 1.3; }
          .event-content { color: #334155; font-size: 15px; line-height: 1.7; word-wrap: break-word; margin-bottom: 20px; }
          .event-details { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
          .detail-row { display: flex; padding: 8px 0; border-bottom: 1px solid #edf2f7; font-size: 14px; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: 600; color: #64748b; width: 120px; flex-shrink: 0; }
          .detail-value { color: #1e293b; font-weight: 500; }
          .button-container { text-align: center; margin-top: 32px; }
          .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); transition: all 0.2s; }
          .button-secondary { display: inline-block; background-color: #f1f5f9; color: #1e293b !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 12px; border: 1px solid #cbd5e1; }
          .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 13px; border-top: 1px solid #f1f5f9; background-color: #fafafa; }
          .footer p { margin: 4px 0; }
          .unsubscribe { color: #2563eb; text-decoration: none; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>Kabar Alumni Terbaru</h1>
              <p>DPW IKA UII JATENG</p>
            </div>
            <div class="content">
              <h2 class="salutation">Halo {{NAME}},</h2>
              <p class="intro-text">Ada agenda atau kegiatan terbaru dari platform Jejaring Alumni DPW IKA UII JATENG yang wajib Anda ikuti. Berikut rincian acaranya:</p>
              
              <div class="event-card">
                <div class="event-body">
                  <span class="event-badge">📅 Agenda & Event</span>
                  <h3 class="event-title">${event.title}</h3>
                  <div class="event-content">
                    ${event.description || ''}
                  </div>
                  
                  <div class="event-details">
                    <div class="detail-row">
                      <span class="detail-label">📅 Hari & Tanggal</span>
                      <span class="detail-value">${new Date(event.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">🕒 Waktu</span>
                      <span class="detail-value">${new Date(event.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">📍 Lokasi</span>
                      <span class="detail-value">${event.lokasi || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="button-container">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/events/${event.id}" class="button">Lihat & Daftar di Website</a>
                ${event.linkDaftar ? `<br><a href="${event.linkDaftar}" target="_blank" class="button-secondary">Link Registrasi Eksternal</a>` : ''}
              </div>
            </div>
            <div class="footer">
              <p>Email ini dikirim karena Anda terdaftar di Sistem Jejaring Alumni DPW IKA UII JATENG.</p>
              <p>Ingin mengatur notifikasi? <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/profil" class="unsubscribe">Klik di sini</a></p>
              <p>&copy; ${new Date().getFullYear()} DPW IKA UII JATENG. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    // Create queue entries in bulk
    const queueData = users.map(user => ({
      userId: user.id,
      subject: `[Event] ${event.title}`,
      content: template.replace('{{NAME}}', user.nama),
      status: 'PENDING'
    }))

    // Prisma createMany is efficient for this
    const result = await prisma.mailQueue.createMany({
      data: queueData,
      skipDuplicates: true
    })

    console.log(`Queued ${result.count} emails for event: ${event.title}`)
    return result.count
  } catch (error) {
    console.error('Error queueing event broadcast:', error)
    throw error
  }
}

/**
 * Process a batch of pending emails from the queue
 * Recommended to be called by a cron job every minute
 */
export const processEmailQueue = async (batchSize = 30) => {
  try {
    // Get pending items, prioritize older ones
    const queueItems = await prisma.mailQueue.findMany({
      where: {
        status: 'PENDING',
        attempts: { lt: 3 } // Max 3 retry attempts
      },
      take: batchSize,
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { email: true }
        }
      }
    })

    if (queueItems.length === 0) return 0

    console.log(`Processing batch of ${queueItems.length} emails...`)

    // Update status to PROCESSING immediately to avoid double processing
    const ids = queueItems.map(item => item.id)
    await prisma.mailQueue.updateMany({
      where: { id: { in: ids } },
      data: { status: 'PROCESSING' }
    })

    let successCount = 0
    let failureCount = 0

    // Config allowed emails for development to prevent spam bounces
    const isDevelopment = process.env.NODE_ENV === 'development'
    const adminEmail = (process.env.EMAIL_USER || '').toLowerCase()
    const fromEmail = (process.env.EMAIL_FROM || '').toLowerCase()
    const whitelistEmails = process.env.EMAIL_WHITELIST
      ? process.env.EMAIL_WHITELIST.split(',').map(e => e.trim().toLowerCase())
      : []

    // Send emails one by one in the batch
    for (const item of queueItems) {
      try {
        const recipientEmail = item.user.email.toLowerCase()
        
        // In dev, skip if email is not the admin's email or whitelisted test email
        if (isDevelopment) {
          const isAllowed = recipientEmail === adminEmail || 
                            recipientEmail === fromEmail || 
                            whitelistEmails.includes(recipientEmail) ||
                            recipientEmail.endsWith('@ikauiijateng.org')

          if (!isAllowed) {
            console.log(`[Dev] Skipping email send to mock user ${item.user.email} to prevent delivery failure bounces.`)
            await prisma.mailQueue.update({
              where: { id: item.id },
              data: {
                status: 'COMPLETED',
                attempts: { increment: 1 },
                error: 'SKIPPED_IN_DEV: Recipient not whitelisted'
              }
            })
            successCount++
            continue
          }
        }

        await transporter.sendMail({
          from: `"${process.env.EMAIL_FROM_NAME || 'DPW IKA UII JATENG'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
          to: item.user.email,
          subject: item.subject,
          html: item.content
        })

        await prisma.mailQueue.update({
          where: { id: item.id },
          data: {
            status: 'COMPLETED',
            attempts: { increment: 1 }
          }
        })
        successCount++
      } catch (error) {
        console.error(`Failed to send email to ${item.user.email}:`, error)
        await prisma.mailQueue.update({
          where: { id: item.id },
          data: {
            status: item.attempts >= 2 ? 'FAILED' : 'PENDING', // Retry if attempts < 3
            attempts: { increment: 1 },
            error: error.message
          }
        })
        failureCount++
      }
    }

    console.log(`Batch processed. Success: ${successCount}, Failed: ${failureCount}`)
    return { successCount, failureCount }
  } catch (error) {
    console.error('Error processing email queue:', error)
    throw error
  }
}
