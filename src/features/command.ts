import { App } from '@slack/bolt'
import axios from 'axios'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'

import { slack, stickershop } from '../requests'
import { emoji, regex } from '../utilities'
import { stickrEmojiPrefix, stickrSlashCommand, stickrTemporaryDirectoryPath } from '../globalSettings'
import { aliasRepository, userRepository } from '../repositories'
import { HelpComponent } from '../views'

export const Command = (app: App) => {
  app.command(stickrSlashCommand, async ({ ack, client, command }) => {
    await ack()

    const channnelId = command.channel_id
    const userId = command.user_id
    const teamId = command.team_id

    const commandText = command.text
    const commandTextArgs = commandText.split(' ')
    const subCommand = commandTextArgs[0]

    try {
      /**
       * help サブコマンド
       */
      if (subCommand === 'help') {
        await client.chat.postEphemeral({
          channel: channnelId,
          text: '',
          blocks: HelpComponent(),
          user: userId,
        })

        return
      }

      /**
       * token サブコマンド
       */
      if (subCommand === 'token') {
        const xoxsToken = commandTextArgs[1]

        // token の有効性を検証する
        await client.auth.test({ token: xoxsToken })

        // token を永続化する
        await userRepository.upsert({ userId, teamId, xoxsToken })

        await client.chat.postEphemeral({
          channel: channnelId,
          text: 'トークンを保存しました',
          user: userId,
        })

        return
      }

      /**
       * add サブコマンド
       */
      if (subCommand === 'add') {
        const productId: any = commandTextArgs[1]

        mkdirp.sync(stickrTemporaryDirectoryPath)

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
              const filePath = path.resolve(stickrTemporaryDirectoryPath, `${sticker.id}.png`)

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
              prefix: stickrEmojiPrefix,
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
          channel: channnelId,
          text: '追加しました',
          user: userId,
        })

        return
      }

      /**
       * mapping サブコマンド
       */
      if (subCommand === 'mapping') {
        /**
         * 対象チームの既存のエイリアスを全て削除する
         */
        await aliasRepository.deleteAll({ teamId })

        /**
         * 対象チームの絵文字一覧を取得する
         */
        const emojiList: any = await client.emoji.list()

        /**
         * `alias:スタンプ_` から始まる絵文字を DB に登録する
         */
        await Promise.all(
          Object.entries(emojiList.emoji).map(async ([key, value]) => {
            const isStickrEmojiAlias = (value as string).match(regex.isStickrEmojiAliasNameRegex)

            if (!isStickrEmojiAlias) return

            const { productId, stickerId } = emoji.parse((value as string).split(':')[1])

            await aliasRepository.create({ name: key, productId, stickerId, teamId })
          })
        )

        await client.chat.postEphemeral({
          channel: channnelId,
          text: 'エイリアスのマッピングを更新しました',
          user: userId,
        })

        return
      }

      await client.chat.postEphemeral({
        channel: channnelId,
        text: '有効なコマンドを入力してください',
        user: userId,
      })
    } catch (error) {
      await client.chat.postEphemeral({
        channel: channnelId,
        text: 'エラーが発生しました',
        user: userId,
      })

      throw error
    }
  })
}
