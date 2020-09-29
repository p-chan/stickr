import { App } from '@slack/bolt'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import cheerio from 'cheerio'
import fetch from 'isomorphic-unfetch'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

const createUserTokenSectionBlock = ({ hasToken, isVerify }: { hasToken: boolean; isVerify: boolean }) => {
  const text = (() => {
    if (!hasToken) return '未設定'

    return isVerify ? '有効' : '無効'
  })()

  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*あなたのトークン:* ${text}`,
    },
  }
}

const newTokenButtonBlock = {
  type: 'actions',
  elements: [
    {
      type: 'button',
      text: {
        type: 'plain_text',
        text: '新しいトークンを設定する',
      },
      action_id: 'open_new_token_modal',
    },
  ],
}

const newTokenInputBlock = {
  type: 'input',
  block_id: 'primary',
  label: {
    type: 'plain_text',
    text: 'xoxs- から始まるトークンを入れてください',
  },
  element: {
    type: 'plain_text_input',
    placeholder: {
      type: 'plain_text',
      text: 'xoxs-123-456-789-abc',
    },
    action_id: 'xoxs_token',
    multiline: false,
  },
}

const newStickerButtonBlock = {
  type: 'actions',
  elements: [
    {
      type: 'button',
      text: {
        type: 'plain_text',
        text: '新しいスタンプを追加する',
      },
      action_id: 'open_new_sticker_modal',
    },
  ],
}

const newStickerInputBlock = {
  type: 'input',
  block_id: 'primary',
  label: {
    type: 'plain_text',
    text: 'スタンプの ID を入れてください',
  },
  element: {
    type: 'plain_text_input',
    placeholder: {
      type: 'plain_text',
      text: '123456',
    },
    action_id: 'product_id',
    multiline: false,
  },
}

const updateAliasesButtonBlock = {
  type: 'actions',
  elements: [
    {
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'エイリアスの紐付けを更新する',
      },
      action_id: 'update_aliases_action',
    },
  ],
}

export const AppHome = (app: App) => {
  /**
   * ホームを開いたとき
   */
  app.event('app_home_opened', async ({ body, client, event }) => {
    try {
      const user = await prisma.user.findOne({
        where: {
          id_teamId: {
            id: event.user,
            teamId: body.team_id,
          },
        },
      })

      if (user == undefined) {
        await client.views.publish({
          user_id: event.user,
          view: {
            type: 'home',
            blocks: [createUserTokenSectionBlock({ hasToken: false, isVerify: false }), newTokenButtonBlock],
          },
        })

        return
      }

      // エラーが出たら throw する
      const isVerify = await client.auth.test({
        token: user.xoxsToken,
      })

      await client.views.publish({
        user_id: event.user,
        view: {
          type: 'home',
          blocks: [
            createUserTokenSectionBlock({ hasToken: true, isVerify: isVerify.ok }),
            newTokenButtonBlock,
            newStickerButtonBlock,
            updateAliasesButtonBlock,
          ],
        },
      })
    } catch (error) {
      await client.views.publish({
        user_id: event.user,
        view: {
          type: 'home',
          blocks: [createUserTokenSectionBlock({ hasToken: true, isVerify: false }), newTokenButtonBlock],
        },
      })
    }
  })

  /**
   * 新しいトークンを設定するモーダルを開いたとき
   */
  app.action('open_new_token_modal', async ({ ack, body, client }) => {
    ack()

    await client.views.open({
      trigger_id: (body as any).trigger_id,
      view: {
        type: 'modal',
        callback_id: 'submit_new_token_modal',
        title: {
          type: 'plain_text',
          text: '新しいトークンを設定する',
        },
        blocks: [newTokenInputBlock],
        submit: {
          type: 'plain_text',
          text: 'Submit',
        },
      },
    })
  })

  /**
   * 新しいトークンを設定するモーダルを submit したとき
   */
  app.view('submit_new_token_modal', async ({ ack, body, client }) => {
    ack()

    try {
      const xoxsToken: any = (body.view.state as any).values.primary.xoxs_token.value

      await prisma.user.upsert({
        where: {
          id: body.user.id,
        },
        create: {
          id: body.user.id,
          team: {
            connect: {
              id: body.team.id,
            },
          },
          xoxsToken: xoxsToken,
        },
        update: {
          id: body.user.id,
          team: {
            connect: {
              id: body.team.id,
            },
          },
          xoxsToken: xoxsToken,
        },
      })

      // エラーが出たら throw する
      const isVerify = await client.auth.test({
        token: xoxsToken,
      })

      await client.views.publish({
        user_id: body.user.id,
        view: {
          type: 'home',
          blocks: [createUserTokenSectionBlock({ hasToken: true, isVerify: isVerify.ok }), newTokenButtonBlock],
        },
      })
    } catch (error) {
      await client.views.publish({
        user_id: body.user.id,
        view: {
          type: 'home',
          blocks: [
            createUserTokenSectionBlock({ hasToken: true, isVerify: false }),
            newTokenButtonBlock,
            newStickerButtonBlock,
          ],
        },
      })
    }
  })

  /**
   * 新しいスタンプを追加するモーダルを開いたとき
   */
  app.action('open_new_sticker_modal', async ({ ack, body, client }) => {
    ack()

    await client.views.open({
      trigger_id: (body as any).trigger_id,
      view: {
        type: 'modal',
        callback_id: 'submit_new_sticker_modal',
        title: {
          type: 'plain_text',
          text: '新しいスタンプを追加する',
        },
        blocks: [newStickerInputBlock],
        submit: {
          type: 'plain_text',
          text: 'Submit',
        },
      },
    })
  })

  /**
   * 新しいスタンプを追加するモーダルを submit したとき
   */
  app.view('submit_new_sticker_modal', async ({ ack, body, client }) => {
    ack()

    try {
      const stickers: {
        id: number
        staticUrl: string
      }[] = []
      const productId: any = (body.view.state as any).values.primary.product_id.value
      const temporaryDirectoryPath = path.resolve(process.cwd(), './tmp')

      /**
       * DM で開始を通知
       */
      await client.chat.postMessage({
        channel: body.user.id,
        text: 'スタンプの追加を開始します',
      })

      /**
       * ユーザー情報を取得する
       */
      const user = await prisma.user
        .findOne({
          where: {
            id_teamId: {
              id: body.user.id,
              teamId: body.team.id,
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
          form.append('name', `stickr_${savedSticker.id}`)
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

      /**
       * DM で完了を通知
       */
      await client.chat.postMessage({
        channel: body.user.id,
        text: 'スタンプの追加が完了しました',
      })
    } catch (error) {
      console.error(error)

      await client.chat.postMessage({
        channel: body.user.id,
        text: '失敗しました...',
      })
    }
  })

  /**
   * エイリアスの紐付けを更新する
   */
  app.action('update_aliases_action', async ({ ack, body, client }) => {
    ack()

    try {
      const teamId = body.team.id

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
          const isStickrAlias = (value as string).match(/^(alias:stickr_)[\d]+/g)

          if (!isStickrAlias) return

          const originalName = (value as string).split(':')[1]

          await prisma.alias.create({
            data: {
              name: key,
              originalName: originalName,
              team: {
                connect: {
                  id: teamId,
                },
              },
            },
          })
        })
      )

      await client.chat.postMessage({
        channel: body.user.id,
        text: 'エイリアスの紐付けを更新しました',
      })
    } catch (error) {
      await client.chat.postMessage({
        channel: body.user.id,
        text: 'エイリアスの紐付けに失敗しました',
      })
    }
  })
}
