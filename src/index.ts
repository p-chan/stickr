import { App, Installation, InstallationQuery } from '@slack/bolt'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

const environment = process.env.NODE_ENV || 'development'

if (environment === 'development') {
  dotenv.config()
}

const prisma = new PrismaClient()

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.SLACK_STATE_SECRET,
  scopes: ['channels:history', 'chat:write', 'groups:history', 'im:history', 'mpim:history'],
  installationStore: {
    storeInstallation: async (installation: Installation) => {
      if (installation.enterprise) throw new Error('Enterprise is not support')

      const data = {
        teamId: installation.team.id,
        raw: JSON.parse(JSON.stringify(installation)),
      }

      await prisma.installation.upsert({
        where: { teamId: installation.team.id },
        create: data,
        update: data,
      })
    },
    fetchInstallation: async (InstallQuery: InstallationQuery): Promise<Installation> => {
      return ((await prisma.installation
        .findOne({
          where: {
            teamId: InstallQuery.teamId,
          },
        })
        .then((result) => {
          if (result == undefined) throw new Error('Installation is not found')

          return result.raw
        })) as unknown) as Installation
    },
  },
})

app.message('hello', async ({ message, say }) => {
  await say(`Hey there <@${message.user}>!`)
})

app.error(async (error) => {
  console.error(error)
})
;(async () => {
  await app.start(process.env.PORT || 3000)

  console.log('⚡️ Stickr is running!')
})()
