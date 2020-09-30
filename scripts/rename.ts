import { WebClient } from '@slack/web-api'
import axios from 'axios'
import FormData from 'form-data'

/**
 * Document
 *
 * $ TARGET_PREFIX=old NEW_TARGET_PREFIX=new XOXS_TOKEN=xoxs-xxxx npm run rename
 */

/**
 * Settings
 */
const targetPrefix = process.env.TARGET_PREFIX
const newTargetPrefix = process.env.NEW_TARGET_PREFIX
const xoxsToken = process.env.XOXS_TOKEN

/**
 * Scripts
 */

const sleep = (msec: number) => new Promise((resolve) => setTimeout(resolve, msec))
;(async () => {
  try {
    const web = new WebClient(xoxsToken)

    const emojiList: any = await web.emoji.list()

    // prettier-ignore
    const isTargetRegex = new RegExp('^(' + targetPrefix + '_)[0-9]+', 'g')

    const targetEmojiList = Object.keys(emojiList.emoji).filter((key) => {
      const isTargetEmoji = (key as string).match(isTargetRegex)

      if (isTargetEmoji) return true
    })

    for (let i = 0; i < targetEmojiList.length; i++) {
      const targetEmojiName = targetEmojiList[i]
      const targetEmojiProductId = targetEmojiName.split('_')[1]
      const newEmojiName = `${newTargetPrefix}_${targetEmojiProductId}`

      const form: any = new FormData()

      form.append('name', targetEmojiName)
      form.append('new_name', newEmojiName)

      const config = {
        headers: {
          Authorization: `Bearer ${xoxsToken}`,
          ...form.getHeaders(),
        },
      }

      await axios.post('	https://slack.com/api/emoji.rename', form, config).then((res) => {
        console.log(`${targetEmojiName} を ${newEmojiName} にリネームしました （${i + 1} / ${targetEmojiList.length}）`)
        console.log(res.data)
      })

      await sleep(3000)
    }
  } catch (error) {
    console.error(error)

    return process.exit(1)
  }
})()
