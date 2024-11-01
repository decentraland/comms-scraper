import type {
  IConfigComponent,
  ILoggerComponent,
  IHttpServerComponent,
  IBaseComponent,
  IMetricsComponent,
  IFetchComponent
} from '@well-known-components/interfaces'
import { metricDeclarations } from './metrics'
import { IStorageComponent } from './adapters/storage'

export type GlobalContext = {
  components: BaseComponents
}

// components used in every environment
export type BaseComponents = {
  config: IConfigComponent
  logs: ILoggerComponent
  server: IHttpServerComponent<GlobalContext>
  metrics: IMetricsComponent<keyof typeof metricDeclarations>
  awsConfig: AwsConfig
  storage: IStorageComponent
  fetch: IFetchComponent
  commsFetcher: ICommsFetcher
  scraper: IScraperWorker
}

// components used in runtime
export type AppComponents = BaseComponents & {
  statusChecks: IBaseComponent
}

// components used in tests
export type TestComponents = BaseComponents & {
  // A fetch component that only hits the test server
  localFetch: IFetchComponent
}

// this type simplifies the typings of http handlers
export type HandlerContextWithPath<
  ComponentNames extends keyof AppComponents,
  Path extends string = any
> = IHttpServerComponent.PathAwareContext<
  IHttpServerComponent.DefaultContext<{
    components: Pick<AppComponents, ComponentNames>
  }>,
  Path
>

export type Context<Path extends string = any> = IHttpServerComponent.PathAwareContext<GlobalContext, Path>

export type AwsConfig = {
  region: string
  credentials?: { accessKeyId: string; secretAccessKey: string }
  endpoint?: string
  forcePathStyle?: boolean // for SDK v3
  s3ForcePathStyle?: boolean // for SDK v2
}

export type ICommsFetcher = {
  fetchIslands(): Promise<FetchIslandsResult>
}

export type IScraperWorker = {
  start(): Promise<void>
}

export type Islands = {
  id: string
  maxPeers: number
  center: [number, number, number]
  radius: number
  peers: Array<{
    id: string
    address: string
    lastPing: number
    parcel: [number, number]
    position: [number, number, number]
  }>
}

export type FetchIslandsResult = {
  result: Array<Islands>
} | null
