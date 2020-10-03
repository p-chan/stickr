import { Middleware, SlackShortcut, SlackShortcutMiddlewareArgs, SlackViewMiddlewareArgs } from '@slack/bolt'

import { aliasRepository, userRepository } from '../repositories'
import { slack } from '../requests'
import { emoji, regex } from '../utilities'
import { AddAliasModalComponent } from '../views'

export const openModal: Middleware<SlackShortcutMiddlewareArgs<SlackShortcut>> = async ({
  shortcut,
  ack,
  client,
  body,
}) => {
  ack()

  try {
    const firstBlock = (body as any).message.blocks[0]

    if (firstBlock.type !== 'image' || firstBlock.alt_text.match(regex.isStickrEmojiNameRegex) == undefined) {
      throw new Error("This post is not Stickr's post")
    }

    await client.views.open({
      trigger_id: shortcut.trigger_id,
      view: AddAliasModalComponent({ altText: firstBlock.alt_text, channelId: (shortcut as any).channel.id }),
    })
  } catch (error) {
    console.error(error)
  }
}

export const submitModal: Middleware<SlackViewMiddlewareArgs> = async ({ ack, body, client, view }) => {
  ack()

  const privateMetadata = JSON.parse(view.private_metadata)

  try {
    /**
     * ユーザー情報を取得する
     */
    const user = await userRepository.findOne({ userId: body.user.id, teamId: body.team.id })

    if (user == undefined) throw new Error('ユーザーが見つかりませんでした')

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

    await slack.addEmojiAlias({
      name: aliasName,
      aliasFor: altText,
      token: user.xoxsToken,
    })

    /**
     * DB にエイリアスを追加する
     */
    const { productId, stickerId } = emoji.parse(altText)

    await aliasRepository.create({ name: aliasName, productId, stickerId, teamId: body.team.id })

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

    throw error
  }
}
