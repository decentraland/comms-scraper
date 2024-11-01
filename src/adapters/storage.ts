import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { AppComponents, FetchIslandsResult } from '../types'

export type IStorageComponent = {
  store(key: string, content: Buffer, contentType: string): Promise<void>
  fetch(key: string): Promise<Record<string, FetchIslandsResult> | null>
}

export async function createStorageComponent({
  awsConfig,
  config,
  metrics,
  logs
}: Pick<AppComponents, 'awsConfig' | 'config' | 'metrics' | 'logs'>): Promise<IStorageComponent> {
  const logger = logs.getLogger('storage')
  const s3 = new S3Client(awsConfig)
  const bucket = await config.requireString('BUCKET_NAME')

  async function store(key: string, content: Buffer, contentType: string): Promise<void> {
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: bucket,
        Key: `${key}`,
        Body: content,
        ContentType: contentType
      }
    })
    await upload.done()
  }

  async function fetch(key: string): Promise<Record<string, FetchIslandsResult> | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: `${key}`
      })

      const response = await s3.send(command)

      if (!response.Body) {
        logger.warn('No data found in the response Body')
        return null
      }

      const streamToString = async (stream: ReadableStream): Promise<string> => {
        const reader = stream.getReader()
        const chunks: Uint8Array[] = []
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
        }
        return Buffer.concat(chunks).toString('utf-8')
      }

      const contentString = await streamToString(response.Body as ReadableStream)
      return JSON.parse(contentString) as Record<string, FetchIslandsResult>
    } catch (error) {
      logger.warn('No existing log found or failed to fetch', {
        message: error instanceof Error ? error.message : 'Unknown error'
      })
      return null
    }
  }

  return {
    store,
    fetch
  }
}
