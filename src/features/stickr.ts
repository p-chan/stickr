import { App, SayArguments } from '@slack/bolt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const createStickerBlocks = ({
  id,
  stickerImageUrl,
  profileImageUrl,
  displayName,
}: {
  id: string
  stickerImageUrl: string
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
      alt_text: `stickr_${id}`,
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
      const stickrEmojiName = await (async () => {
        const matchedText = context.matches[0]
        const matchedTextWithoutColon = matchedText.replace(/:/g, '')

        // `:sticker_` から始まり `:` で終わるポストの場合、そのまま返す
        if (matchedText.match(/^(:stickr_)[\d]+(:)$/g)) {
          return matchedTextWithoutColon
        }

        // ポストされた絵文字がエイリアスとして登録されていないか調べる
        const alias = await prisma.alias.findOne({
          where: {
            name_teamId: {
              name: matchedTextWithoutColon,
              teamId: body.team_id,
            },
          },
        })

        // エイリアスの場合、オリジナルの絵文字の名前を返す
        if (alias) return alias.originalName

        // 上記に該当しない場合、undefined を返す
        return
      })()

      // stickr に関連する絵文字ではない場合、return する
      if (stickrEmojiName == undefined) return

      // ユーザー情報の取得
      const { user }: any = await client.users.info({
        user: event.user,
      })

      // ユーザートークンの取得
      const userToken = await prisma.team
        .findOne({
          where: {
            id: body.team_id,
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

      // 画像の投稿
      const stickerId: string = stickrEmojiName.split('_')[1]
      const stickerImageURL = `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker.png`

      say({
        blocks: createStickerBlocks({
          id: stickerId,
          stickerImageUrl: stickerImageURL,
          profileImageUrl: user.profile.image_24,
          displayName: user.profile.display_name === '' ? user.name : user.profile.display_name,
        }),
      } as SayArguments)
    } catch (error) {
      console.error(error)
    }
  })
}
