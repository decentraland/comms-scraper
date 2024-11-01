import { HandlerContextWithPath } from "../../types"
import { IHttpServerComponent } from '@well-known-components/interfaces'

// handlers arguments only type what they need, to make unit testing easier
export async function pingHandler(context: Pick<HandlerContextWithPath<"metrics" | "commsFetcher" , "/ping">, "url" | "components">) : Promise<IHttpServerComponent.IResponse>  {
  const { metrics, commsFetcher } = context.components


  const islands = await commsFetcher.fetchIslands() 
  console.log(islands)
  return islands ? { body: islands } : { body: "" }

  
}
