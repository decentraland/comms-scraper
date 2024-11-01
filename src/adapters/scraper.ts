import { AppComponents, FetchIslandsResult } from '../types'
import { IScraperWorker } from '../types'
import { sleep } from '../logic/sleep'
import { Upload } from '@aws-sdk/lib-storage'

export async function createScraperComponent({
  config,
  logs,
  storage,
  metrics,
  commsFetcher
}: Pick<AppComponents, 'config' | 'logs' | 'storage' | 'metrics' | 'commsFetcher'>): Promise<IScraperWorker> {
  const logger = logs.getLogger('scrapper')
  const MAX_DAYS = 7
  const S3_KEY = 'islands-log.json'

  async function fetchAndStoreData() {
    const timestamp = new Date().toISOString()
    try {
      const islandsData = await commsFetcher.fetchIslands()

      if (islandsData) {
        // Fetch current log from S3
        const currentLog = (await fetchCurrentLogFromS3()) || {}

        // Add new data to the log
        currentLog[timestamp] = islandsData

        // Remove old entries beyond 7 days
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - MAX_DAYS)
        for (const key in currentLog) {
          if (new Date(key) < cutoff) {
            delete currentLog[key]
          }
        }

        // Store updated log to S3
        const logContent = Buffer.from(JSON.stringify(currentLog, null, 2))
        await storage.store(S3_KEY, logContent, 'application/json')
        logger.debug(`Fetched and stored islands data at ${timestamp}`)
      } else {
        logger.warn(`Failed to fetch islands data at ${timestamp}`)
      }
    } catch (error) {
      logger.error('Error during data fetching and storage', {
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  async function fetchCurrentLogFromS3(): Promise<Record<string, FetchIslandsResult> | null> {
    try {
      const result = await storage.fetch(S3_KEY)
      if (result) {
        const log = JSON.parse(result.toString())
        return log as Record<string, FetchIslandsResult>
      } else {
        // If the file doesn't exist, create it with an empty JSON object
        await storage.store(S3_KEY, Buffer.from(JSON.stringify({})), 'application/json')
        logger.info(`Created new log file: ${S3_KEY}`)
        return {} // Return an empty log
      }
    } catch (error) {
      logger.warn('No existing log found or failed to fetch', {
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    return null
  }

  async function start(): Promise<void> {
    logger.debug('Starting data scraping')

    while (true) {
      await fetchAndStoreData()
      await sleep(10 * 1000) // Wait for 10 seconds
    }
  }

  return { start }
}
