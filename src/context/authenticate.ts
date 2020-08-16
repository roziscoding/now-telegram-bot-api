import { NowContext } from '../types/NowContext'

export function authenticate (token: string, { req, res }: NowContext) {
  if (!token) throw new Error('no auth token')
  if (token !== req.query.token) {
    res.status(401).end()
  }

  return { req, res }
}
