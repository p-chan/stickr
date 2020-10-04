import {
  Middleware,
  SlackCommandMiddlewareArgs,
  SlackEventMiddlewareArgs,
  SayArguments,
  SlackViewMiddlewareArgs,
} from '@slack/bolt'
import axios from 'axios'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'

import { userRepository, aliasRepository, teamRepository } from '../repositories'
import { stickershop, slack } from '../requests'
import { globalSettings, emoji, regex } from '../utilities'
import { StickerComponent, AddStickersModalComponent } from '../views'

export const openAddModal: Middleware<SlackCommandMiddlewareArgs> = async ({ ack, client, command, body }) => {
  try {
    await client.views.open({
      trigger_id: command.trigger_id,
      view: AddStickersModalComponent({ channelId: command.channel_id }),
    })
  } catch (error) {
    console.error(error)
  }
}

export const submitAddModal: Middleware<SlackViewMiddlewareArgs> = async ({ ack, body, client, view }) => {
  ack()

  const privateMetadata = JSON.parse(view.private_metadata)

  const channelId = privateMetadata.channelId
  const teamId = body.team.id
  const userId = body.user.id

  try {
    const productId: string = (body.view.state as any).values.primary.product_id.value
    const suffix: string = (body.view.state as any).values.secondary.suffix.value

    if (!suffix.match(/^[a-zA-Z0-9]+$/)) throw new Error('サフィックスが無効です')

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
          suffix,
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

export const replace: Middleware<SlackEventMiddlewareArgs<'message'>> = async ({
  context,
  body,
  client,
  event,
  say,
}) => {
  try {
    /**
     * オリジナルの絵文字の名前の取得
     */
    const { productId, stickerId, suffix } = await (async () => {
      const matchedText = context.matches[0]

      // `:スタンプ_1234_1234_newgame:` のようなポストの場合
      if (matchedText.match(regex.isStickrEmojiNameWithSuffixAndColon)) {
        const { productId, stickerId, suffix } = emoji.parse(matchedText)

        return { productId, stickerId, suffix }
      }

      // ポストされた絵文字がエイリアスとして登録されていないか調べる
      const alias = await aliasRepository.findOne({
        name: emoji.convertWithoutColon(matchedText),
        teamId: body.team_id,
      })

      // エイリアスが見つかった場合、オリジナルの絵文字の名前を返す
      if (alias) {
        return {
          productId: alias.productId,
          stickerId: alias.stickerId,
          suffix: alias.suffix,
        }
      }

      // 上記に該当しない場合、undefined を返す
      return {
        productId: undefined,
        stickerId: undefined,
        suffix: undefined,
      }
    })()

    // stickr に関連する絵文字ではない場合、return する
    if (productId == undefined || stickerId == undefined || suffix == undefined) return

    // ユーザー情報の取得
    const { user }: any = await client.users.info({
      user: event.user,
    })

    // ユーザートークンの取得
    const team = await teamRepository.findOne({ teamId: body.team_id })

    if (team == undefined) throw new Error('チームがありません')

    const userToken = JSON.parse(JSON.stringify(team.raw)).user.token

    if (userToken == undefined) throw new Error('ユーザートークンがありません')

    // メッセージの削除
    await client.chat.delete({
      token: userToken,
      channel: event.channel,
      ts: event.ts,
      as_user: true,
    })

    say({
      blocks: StickerComponent({
        stickerImageUrl: `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker.png`,
        stickerAltText: emoji.stringify({
          prefix: globalSettings.emojiPrefix,
          productId,
          stickerId,
          suffix,
        }),
        profileImageUrl: user.profile.image_24,
        displayName: user.profile.display_name === '' ? user.name : user.profile.display_name,
      }),
    } as SayArguments)
  } catch (error) {
    console.error(error)
  }
}
