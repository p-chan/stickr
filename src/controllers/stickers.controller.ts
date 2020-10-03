import { Middleware, SlackCommandMiddlewareArgs } from '@slack/bolt'
import axios from 'axios'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'

import { userRepository } from '../repositories'
import { stickershop, slack } from '../requests'
import { globalSettings, emoji } from '../utilities'

export const add: Middleware<SlackCommandMiddlewareArgs> = async ({ client, command }) => {
  const channelId = command.channel_id
  const teamId = command.team_id
  const userId = command.user_id

  try {
    const productId: any = command.text.split(' ')[1]

    mkdirp.sync(globalSettings.temporaryDirectoryPath)

    /**
     * ユーザー情報を取得する
     */
    const user = await userRepository.findOne({ userId, teamId })

    if (user == undefined) throw new Error('ユーザーが見つかりませんでした')

    /**
     * xoxs トークンを検証する
     */
    await client.auth.test({
      token: user.xoxsToken,
    })

    /**
     * LINE スタンプをスクレイピングする
     */
    const product = await stickershop.getProduct(productId)

    /**
     * LINE スタンプをテンポラリーディレクトリに保存する
     */
    const savedStickers = await Promise.all(
      product.stickers.map(async (sticker) => {
        return await axios({
          method: 'get',
          url: sticker.url,
          responseType: 'stream',
        }).then((response) => {
          const filePath = path.resolve(globalSettings.temporaryDirectoryPath, `${sticker.id}.png`)

          response.data.pipe(fs.createWriteStream(filePath))

          return {
            id: sticker.id,
            filePath: filePath,
          }
        })
      })
    )

    /**
     * LINE スタンプを emoji としてアップロードする
     */
    await Promise.all(
      savedStickers.map(async (savedSticker) => {
        const name = emoji.stringify({
          prefix: globalSettings.emojiPrefix,
          productId: product.id,
          stickerId: savedSticker.id,
        })

        await slack.addEmoji({
          name: name,
          file: fs.createReadStream(savedSticker.filePath),
          token: user.xoxsToken,
        })
      })
    )

    await client.chat.postEphemeral({
      channel: channelId,
      text: '追加しました',
      user: userId,
    })
  } catch (error) {
    await client.chat.postEphemeral({
      channel: channelId,
      text: 'エラーが発生しました',
      user: userId,
    })

    console.error(error)
  }
}
