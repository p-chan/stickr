import { App } from '@slack/bolt'

export const Ping = (app: App) => {
  app.event('app_mention', async ({ say }) => {
    await say('pong')
  })
}
