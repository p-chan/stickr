import { App, Installation, InstallationQuery } from '@slack/bolt'
import dotenv from 'dotenv'

import { AliasesController, MessagesController, StickersController, TokensController } from './controllers'
import { teamRepository } from './repositories'
import { globalSettings } from './utilities'

if (globalSettings.environment === 'development') {
  dotenv.config()
}

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.SLACK_STATE_SECRET,
  scopes: [
    'app_mentions:read',
    'channels:history',
    'chat:write',
    'commands',
    'emoji:read',
    'groups:history',
    'im:history',
    'mpim:history',
    'users:read',
  ],
  installerOptions: {
    userScopes: ['chat:write'],
  },
  installationStore: {
    storeInstallation: async (installation: Installation) => {
      if (installation.enterprise) throw new Error('Enterprise is not support')

      await teamRepository.upsert({ teamId: installation.team.id, installation })
    },
    fetchInstallation: async (installQuery: InstallationQuery): Promise<Installation> => {
      const team = await teamRepository.findOne({ teamId: installQuery.teamId })

      if (team == undefined) throw new Error('チームが見つかりませんでした')

      return (team.raw as unknown) as Installation
    },
  },
})

app.command(globalSettings.slashCommand, async (context) => {
  await context.ack()

  const subCommand = context.command.text.split(' ')[0]

  if (subCommand === 'add') return await StickersController.openAddModal(context)
  if (subCommand === 'token') return await TokensController.openAddModal(context)
  if (subCommand === 'mapping') return await AliasesController.forceUpdateAll(context)
  if (subCommand === 'help') return await MessagesController.help(context)

  await context.client.chat.postEphemeral({
    channel: context.command.channel_id,
    text: '有効なコマンドを入力してください',
    user: context.command.user_id,
  })
})

app.shortcut('add_alias_action', AliasesController.openModal)
app.view('submit_add_alias_action', AliasesController.submitModal)
app.view('submit_add_stickers_action', StickersController.submitAddModal)
app.view('submit_add_token_action', TokensController.submitAddModal)
app.event('app_mention', MessagesController.ping)
app.message(/^(:)[\S]+(:)$/g, StickersController.replace)

app.error(async (error) => {
  console.error(error)
})
;(async () => {
  await app.start(process.env.PORT || 3000)

  console.log('⚡️ Stickr is running!')
})()
