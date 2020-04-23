import { NowContext } from './NowContext'
import { Update } from 'telegram-typings'

export type TelegramContext = NowContext & {
  update: Update
}
