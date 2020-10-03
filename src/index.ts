import { App, Installation, InstallationQuery } from '@slack/bolt'
import dotenv from 'dotenv'

import * as features from './features'
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

for (const [featureName, handler] of Object.entries(features)) {
  handler(app)
  console.log(`Loaded feature module: ${featureName}`)
}

app.error(async (error) => {
  console.error(error)
})
;(async () => {
  await app.start(process.env.PORT || 3000)

  console.log('⚡️ Stickr is running!')
})()
