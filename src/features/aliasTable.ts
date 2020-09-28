import { App } from '@slack/bolt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const isStickrAliasRegex = /^(alias:stickr_)[\d]+/g

export const AliasTable = (app: App) => {
  app.event('emoji_changed', async ({ body, client, event }) => {
    try {
      const teamId = body.team_id

      /**
       * event.value が `alias:stickr_` 以外で始まるものは無視
       */
      if (event.value && !event.value.match(isStickrAliasRegex)) return

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
          const isStickrAlias = (value as string).match(isStickrAliasRegex)

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
    } catch (error) {
      console.error(error)
    }
  })
}
