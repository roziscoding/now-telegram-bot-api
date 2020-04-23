import { NowRequest, NowResponse } from '@now/node'

export type NowContext = {
  req: NowRequest
  res: NowResponse
}
