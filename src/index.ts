import logdown from 'logdown'
import { RequireSpecific } from './types/RequireSpecific'
import { TelegramContext } from './types/TelegramContext'
import type { Message, InlineQuery } from 'telegram-typings'
import extractEntityFromText from './util/extract-entity-from-text'

export type UpdateHandlers = {
  message: (message: Message, context: TelegramContext) => any
  inlineQuery: (query: InlineQuery, context: TelegramContext) => any
  edit: (newMessage: Message, oldMessage: Message, context: TelegramContext) => any
  text: (message: RequireSpecific<Message, 'text'>, context: TelegramContext) => any
  tags: {
    [key: string]: (message: Message, context: TelegramContext) => any
  }
  commands: {
    [key: string]: (params: string[], context: TelegramContext) => any
  }
}

export const getUpdateHandler = (handlers: Partial<UpdateHandlers>) => async (context: TelegramContext) => {
  const { update } = context

  const debug = (namespace: string, ...params: any[]) => logdown(`npm-telegram-bot:handlers:${namespace}`).debug(...params)
  debug('generic', 'Received new update with ID', update.update_id)

  if (update.message?.entities && update.message.entities && update.message.entities.length && update.message.text) {
    const { message: { text, entities } } = update

    for (const entity of entities) {
      if (entity.type === 'bot_command' && entity.offset === 0) {
        const command = extractEntityFromText(entity, text, '/')
        const params = text.substr(entity.offset + entity.length).trim().split(' ').filter(param => !!param)
        debug('commands', 'Found command', command, 'with params', params)

        if (handlers.commands?.[command]) {
          debug('commands', 'Found handler for command. Invoking it now')
          await handlers.commands[command](params, context)
          debug('commands', 'Handler finished')
          return
        }

        debug('commands', 'No handler found for command')

        if (handlers.commands?.unhandled) return handlers.commands.unhandled([], context)

        debug('commands', 'Catchall handler for command')
      }

      if (entity.type === 'hashtag') {
        const tag = extractEntityFromText(entity, text, '#')
        debug('tags', 'Found tag', tag)

        if (handlers.tags?.[tag]) {
          debug('tags', 'Found handler for tag. Invoking it now')
          await handlers.tags[tag](update.message, context)
          debug('tags', 'Handler finished')
          return
        }

        debug('tags', 'No handler found for tag')

        if (handlers.tags?.unhandled) return handlers.tags.unhandled(update.message, context)

        debug('tags', 'Catchall handler for tag')
      }
    }
  }

  if (update.message && handlers.message) {
    debug('message', update)
    await handlers.message(update.message, context)
  }

  if (update.edited_message && update.message && handlers.edit) {
    debug('message', update)
    await handlers.edit(update.edited_message, update.message, context)
  }

  if (update.message?.text && handlers.text) {
    debug('text', update)

    await handlers.text(update.message as RequireSpecific<Message, 'text'>, context)
  }

  if (update.message?.text && handlers.tags) {
    if (update.inline_query && handlers.inlineQuery) {
      debug('inline_query', update)

      await handlers.inlineQuery(update.inline_query, context)
    }
  }

  if (!context.res.headersSent) {
    debug('unhandled', 'Update was not handled. Finishing request')
    context.res.end()
  }
}
