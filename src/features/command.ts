import { App } from '@slack/bolt'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import cheerio from 'cheerio'
import FormData from 'form-data'
import fs from 'fs'
import mkdirp from 'mkdirp'
import os from 'os'
import path from 'path'

import { stickrEmojiPrefix } from '../globalSettings'

const prisma = new PrismaClient()

export const Command = (app: App) => {
  app.command('/stickr', async ({ ack, client, command }) => {
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
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: ':question: *ヘルプ*',
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*コマンド一覧*',
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text:
                  '- `/stickr add [ID]` スタンプを追加します\n- `/stickr token [XOXS_TOKEN]` 新しいトークンを設定します\n- `/stickr mapping` エイリアスのマッピングを更新します\n- `/stickr help` ヘルプを表示します\n',
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*トークンとは*',
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text:
                  '`https://[TEAM_NAME].slack.com/customize/emoji` の HTML 内から `xoxs-` で検索をしたときにマッチする一連の文字列のことです。',
              },
            },
          ],
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
        const isVerify = await client.auth
          .test({
            token: xoxsToken,
          })
          .then((res) => {
            return res.ok
          })
          .catch(() => {
            return false
          })

        if (!isVerify) {
          await client.chat.postEphemeral({
            channel: channnelId,
            text: '有効なトークンを入力してください',
            user: userId,
          })

          return
        }

        // token を永続化する
        await prisma.user.upsert({
          where: {
            userId_teamId: {
              userId: userId,
              teamId: teamId,
            },
          },
          create: {
            userId: userId,
            team: {
              connect: {
                teamId: teamId,
              },
            },
            xoxsToken: xoxsToken,
          },
          update: {
            userId: userId,
            team: {
              connect: {
                teamId: teamId,
              },
            },
            xoxsToken: xoxsToken,
          },
        })

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
        const stickers: {
          id: number
          staticUrl: string
        }[] = []
        const productId: any = commandTextArgs[1]
        const temporaryDirectoryPath =
          process.env.NODE_ENV === 'production'
            ? path.resolve('/tmp', './stickr')
            : path.resolve(os.tmpdir(), './stickr')
        mkdirp.sync(temporaryDirectoryPath)

        /**
         * ユーザー情報を取得する
         */
        const user = await prisma.user
          .findOne({
            where: {
              userId_teamId: {
                userId: userId,
                teamId: teamId,
              },
            },
          })
          .then((user) => {
            if (user == undefined) throw new Error('Can not found user')

            return user
          })

        /**
         * xoxs トークンを検証する
         */
        await client.auth.test({
          token: user.xoxsToken,
        })

        /**
         * LINE スタンプをスクレイピングする
         */
        const responseText = await fetch(`https://store.line.me/stickershop/product/${productId}/ja`).then(
          async (response) => {
            if (!response.ok) {
              throw new Error('Sticker is not found')
            }

            return await response.text()
          }
        )

        const $ = cheerio.load(responseText)

        $('.FnStickerPreviewItem').each((_, element) => {
          const json = JSON.parse(element.attribs['data-preview'])

          stickers.push({
            id: json.id,
            staticUrl: json.staticUrl,
          })
        })

        /**
         * LINE スタンプをテンポラリーディレクトリに保存する
         */
        const savedStickers = await Promise.all(
          stickers.map(async (sticker) => {
            return await axios({
              method: 'get',
              url: sticker.staticUrl,
              responseType: 'stream',
            }).then((response) => {
              const filePath = path.resolve(temporaryDirectoryPath, `${sticker.id}.png`)

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
            const form: any = new FormData()
            const file: any = fs.createReadStream(savedSticker.filePath)

            form.append('mode', 'data')
            form.append('name', `${stickrEmojiPrefix}_${savedSticker.id}`)
            form.append('image', file)

            const config = {
              headers: {
                Authorization: `Bearer ${user.xoxsToken}`,
                ...form.getHeaders(),
              },
            }

            await axios.post('https://slack.com/api/emoji.add', form, config)
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
        await prisma.alias.deleteMany({
          where: {
            teamId: teamId,
          },
        })

        /**
         * 対象チームの絵文字一覧を取得する
         */
        const emojiList: any = await client.emoji.list()

        /**
         * `alias:stickr_` から始まる絵文字を DB に登録する
         */
        await Promise.all(
          Object.entries(emojiList.emoji).map(async ([key, value]) => {
            const isStickrAlias = (value as string).match(new RegExp('^(alias:' + stickrEmojiPrefix + '_)[0-9]+', 'g'))

            if (!isStickrAlias) return

            const originalName = (value as string).split(':')[1].replace(`${stickrEmojiPrefix}_`, '')

            await prisma.alias.create({
              data: {
                name: key,
                originalName: originalName,
                team: {
                  connect: {
                    teamId: teamId,
                  },
                },
              },
            })
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
