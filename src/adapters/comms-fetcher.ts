import { AppComponents, ICommsFetcher, FetchIslandsResult, Islands } from '../types'

export async function createCommsFetcher({
  config,
  fetch,
  logs
}: Pick<AppComponents, 'config' | 'fetch' | 'logs'>): Promise<ICommsFetcher> {
  const logger = logs.getLogger('comms-fetcher')

  async function fetchIslands(): Promise<FetchIslandsResult | null> {
    logger.debug('Fetching islands data...')

    try {
      const response = await fetch.fetch(`https://archipelago-stats.decentraland.org/comms/islands`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch islands data: ${response.statusText}`)
      }

      const islands: Islands[] = await response.json()
      return { result: islands }
    } catch (error) {
      logger.error('Error fetching islands', { message: error instanceof Error ? error.message : 'Unknown error' })
      return null
    }
  }

  return { fetchIslands }
}
