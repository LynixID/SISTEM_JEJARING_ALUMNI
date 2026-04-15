import cron from 'node-cron'
import { processEmailQueue } from '../services/broadcastService.js'

/**
 * Initialize all scheduled jobs
 */
const initJobs = () => {
  // Process email queue every 1 minute
  // Send a batch of emails (e.g., 30 per minute)
  cron.schedule('* * * * *', async () => {
    try {
      // console.log('[Cron] Running Email Queue Processor...')
      const result = await processEmailQueue(30)
      if (result && (result.successCount > 0 || result.failureCount > 0)) {
        console.log(`[Cron] Email Batch Processed: ${result.successCount} sent, ${result.failureCount} failed`)
      }
    } catch (error) {
      console.error('[Cron] Email Queue Error:', error)
    }
  })

  console.log('[Cron] Jobs initialized successfully')
}

export default initJobs
