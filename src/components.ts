import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import {
  createServerComponent,
  createStatusCheckComponent,
  instrumentHttpServerWithPromClientRegistry
} from '@well-known-components/http-server'
import { createLogComponent } from '@well-known-components/logger'
import { createMetricsComponent } from '@well-known-components/metrics'
import { AppComponents, GlobalContext } from './types'
import { metricDeclarations } from './metrics'
import { createAwsConfig } from './adapters/aws-config'
import { S3 } from 'aws-sdk'
import { createStorageComponent } from './adapters/storage'
import { createFetchComponent } from '@dcl/platform-server-commons'
import { createCommsFetcher } from './adapters/comms-fetcher'
import { createScraperComponent } from './adapters/scraper'


// Initialize all the components of the app
export async function initComponents(): Promise<AppComponents> {
  const config = await createDotEnvConfigComponent({ path: ['.env.default', '.env'] })
  const metrics = await createMetricsComponent(metricDeclarations, { config })
  const logs = await createLogComponent({ metrics })
  const server = await createServerComponent<GlobalContext>({ config, logs }, {})
  const statusChecks = await createStatusCheckComponent({ server, config })

  const awsConfig = await createAwsConfig({ config })
  const storage = await createStorageComponent({ awsConfig, config, metrics, logs })  
  const fetch = await createFetchComponent()
  const commsFetcher = await createCommsFetcher({config, fetch, logs})
  const scraper = await createScraperComponent({config, logs, storage, metrics, commsFetcher })


  await instrumentHttpServerWithPromClientRegistry({ metrics, server, config, registry: metrics.registry! })

  return {
    config,
    logs,
    server,
    statusChecks,
    metrics,    
    awsConfig,
    storage,
    fetch,
    commsFetcher,
    scraper
  }
}
