import { App, SayArguments } from '@slack/bolt'
import { PrismaClient } from '@prisma/client'

import { stickrEmojiPrefix } from '../globalSettings'
import { emoji, regex } from '../utilities'

const prisma = new PrismaClient()

const createStickerBlocks = ({
  stickerImageUrl,
  stickerAltText,
  profileImageUrl,
  displayName,
}: {
  stickerImageUrl: string
  stickerAltText: string
  profileImageUrl: string
  displayName: string
}) => {
  return [
    {
      type: 'image',
      title: {
        type: 'plain_text',
        text: ' ',
        emoji: true,
      },
      image_url: stickerImageUrl,
      alt_text: stickerAltText,
    },
    {
      type: 'context',
      elements: [
        {
          type: 'image',
          image_url: profileImageUrl,
          alt_text: displayName,
        },
        {
          type: 'mrkdwn',
          text: `Posted by ${displayName}`,
        },
      ],
    },
  ]
}

export const Stickr = (app: App) => {
  /**
   * 絵文字だけのポストに反応する（`:` から始まり `:` で終わるポストのみ）
   */
  app.message(/^(:)[\S]+(:)$/g, async ({ context, body, client, event, say }) => {
    try {
      /**
       * オリジナルの絵文字の名前の取得
       */
      const { productId, stickerId } = await (async () => {
        const matchedText = context.matches[0]

        // `:スタンプ_1234_1234:` のようなポストの場合
        if (matchedText.match(regex.isStickrEmojiNameWithColonRegex)) {
          const { productId, stickerId } = emoji.parse(matchedText)

          return { productId, stickerId }
        }

        // `:スタンプ_1234_1234_newgame:` のようなポストの場合
        if (matchedText.match(regex.isStickrEmojiNameWithSuffixAndColon)) {
          const { productId, stickerId } = emoji.parse(matchedText)

          return { productId, stickerId }
        }

        // ポストされた絵文字がエイリアスとして登録されていないか調べる
        const alias = await prisma.alias.findOne({
          where: {
            name_teamId: {
              name: emoji.convertWithoutColon(matchedText),
              teamId: body.team_id,
            },
          },
        })

        // エイリアスが見つかった場合、オリジナルの絵文字の名前を返す
        if (alias) {
          return {
            productId: alias.productId,
            stickerId: alias.stickerId,
          }
        }

        // 上記に該当しない場合、undefined を返す
        return {
          productId: undefined,
          stickerId: undefined,
        }
      })()

      // stickr に関連する絵文字ではない場合、return する
      if (productId == undefined || stickerId == undefined) return

      // ユーザー情報の取得
      const { user }: any = await client.users.info({
        user: event.user,
      })

      // ユーザートークンの取得
      const userToken = await prisma.team
        .findOne({
          where: {
            teamId: body.team_id,
          },
        })
        .then((team) => {
          if (team == undefined || team.raw == undefined) throw new Error('team is not found')

          const userToken = JSON.parse(JSON.stringify(team.raw)).user.token

          if (userToken == undefined) throw new Error('userToken is not found')

          return userToken
        })

      // メッセージの削除
      await app.client.chat.delete({
        token: userToken,
        channel: event.channel,
        ts: event.ts,
        as_user: true,
      })

      say({
        blocks: createStickerBlocks({
          stickerImageUrl: `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker.png`,
          stickerAltText: emoji.stringify({ prefix: stickrEmojiPrefix, productId: productId, stickerId: stickerId }),
          profileImageUrl: user.profile.image_24,
          displayName: user.profile.display_name === '' ? user.name : user.profile.display_name,
        }),
      } as SayArguments)
    } catch (error) {
      console.error(error)
    }
  })
}
