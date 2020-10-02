import { App } from '@slack/bolt'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import FormData from 'form-data'

import { emoji, regex } from '../utilities'

const prisma = new PrismaClient()

export const AddAlias = (app: App) => {
  app.shortcut('add_alias_action', async ({ shortcut, ack, client, body }) => {
    ack()

    try {
      const firstBlock = (body as any).message.blocks[0]

      if (firstBlock.type !== 'image' || firstBlock.alt_text.match(regex.isStickrEmojiNameRegex) == undefined) {
        throw new Error("This post is not Stickr's post")
      }

      await client.views.open({
        trigger_id: shortcut.trigger_id,
        view: {
          type: 'modal',
          callback_id: 'submit_add_alias_action',
          title: {
            type: 'plain_text',
            text: 'Add alias',
          },
          submit: {
            type: 'plain_text',
            text: 'Submit',
          },
          private_metadata: JSON.stringify({
            altText: firstBlock.alt_text,
            channelId: (shortcut as any).channel.id,
          }),
          blocks: [
            {
              type: 'input',
              block_id: 'primary',
              label: {
                type: 'plain_text',
                text: 'エイリアスの名前を入れてください',
              },
              element: {
                type: 'plain_text_input',
                placeholder: {
                  type: 'plain_text',
                  text: 'alias',
                },
                action_id: 'alias_name',
                multiline: false,
              },
            },
          ],
        },
      })
    } catch (error) {
      console.error(error)
    }
  })

  app.view('submit_add_alias_action', async ({ ack, body, client, view }) => {
    ack()

    const privateMetadata = JSON.parse(view.private_metadata)

    try {
      /**
       * ユーザー情報を取得する
       */
      const user = await prisma.user
        .findOne({
          where: {
            userId_teamId: {
              userId: body.user.id,
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
       * エイリアスを追加する
       */
      const aliasName = (body.view.state as any).values.primary.alias_name.value
      const altText = privateMetadata.altText

      const form: any = new FormData()

      form.append('mode', 'alias')
      form.append('name', aliasName)
      form.append('alias_for', altText)

      const config = {
        headers: {
          Authorization: `Bearer ${user.xoxsToken}`,
          ...form.getHeaders(),
        },
      }

      await axios.post('https://slack.com/api/emoji.add', form, config).then((result) => {
        if (!result.data.ok) throw new Error(result.data.error)
      })

      /**
       * DB にエイリアスを追加する
       */
      const { productId, stickerId } = emoji.parse(altText)

      await prisma.alias.create({
        data: {
          name: aliasName,
          productId,
          stickerId,
          team: {
            connect: {
              teamId: body.team.id,
            },
          },
        },
      })

      await client.chat.postEphemeral({
        channel: privateMetadata.channelId,
        text: `\`:${altText}:\` に \`:${aliasName}:\` を付けました`,
        user: body.user.id,
      })
    } catch (error) {
      await client.chat.postEphemeral({
        channel: privateMetadata.channelId,
        text: `エイリアスの作成に失敗しました...`,
        user: body.user.id,
      })
    }
  })
}
