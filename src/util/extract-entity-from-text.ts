import { MessageEntity } from 'telegram-typings'

export function extractEntityFromText (entity: MessageEntity, text: string, operator?: string | RegExp): string {
  const extracted = text.substr(entity.offset, entity.length)

  if (!operator) return extracted

  if (operator instanceof RegExp) return extracted.replace(operator, '')

  return extracted.replace(new RegExp(operator, 'g'), '')
}

export default extractEntityFromText
