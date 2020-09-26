import { App } from '@slack/bolt'
import dotenv from 'dotenv'

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV == undefined) {
  dotenv.config()
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
})

app.message('hello', async ({ message, say }) => {
  await say(`Hey there <@${message.user}>!`)
})
;(async () => {
  await app.start(process.env.PORT || 3000)

  console.log('⚡️ Stickr is running!')
})()
