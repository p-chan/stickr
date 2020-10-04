import { Middleware, SlackEventMiddlewareArgs, SlackCommandMiddlewareArgs } from '@slack/bolt'

import { HelpComponent } from '../views'

export const ping: Middleware<SlackEventMiddlewareArgs<'app_mention'>> = async ({ say }) => {
  await say('pong')
}

export const help: Middleware<SlackCommandMiddlewareArgs> = async ({ client, command }) => {
  await client.chat.postEphemeral({
    channel: command.channel_id,
    text: '',
    blocks: HelpComponent(),
    user: command.user_id,
  })
}
