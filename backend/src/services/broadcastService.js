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
        <style>
          body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a202c; margin: 0; padding: 0; background-color: #f7fafc; }
          .wrapper { width: 100%; table-layout: fixed; background-color: #f7fafc; padding-bottom: 40px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
          .content { padding: 40px; }
          .announcement-card { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 24px 0; }
          .announcement-image { width: 100%; height: auto; display: block; }
          .announcement-body { padding: 32px; }
          .announcement-title { margin-top: 0; color: #1e3a8a; font-size: 22px; font-weight: 700; line-height: 1.3; }
          .announcement-content { color: #334155; font-size: 16px; line-height: 1.7; word-wrap: break-word; }
          .button-container { text-align: center; margin-top: 32px; }
          .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
          .footer { text-align: center; padding: 20px; color: #718096; font-size: 13px; }
          .unsubscribe { color: #2563eb; text-decoration: none; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>Kabar Alumni Terbaru</h1>
              <p style="margin-top: 8px; opacity: 0.9;">DPW IKA UII JATENG</p>
            </div>
            <div class="content">
              <h2 style="margin-top: 0; color: #1e293b;">Halo {{NAME}},</h2>
              <p>Ada pengumuman atau berita terbaru yang mungkin menarik bagi Anda:</p>
              
              <div class="announcement-card">
                <div class="announcement-body">
                  <h3 class="announcement-title">${announcement.title}</h3>
                  <div class="announcement-content">
                    ${announcement.content}
                  </div>
                </div>
              </div>
              
              <div class="button-container">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/berita/${announcement.slug}" class="button">Lihat di Website</a>
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

    // Send emails one by one in the batch
    for (const item of queueItems) {
      try {
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
