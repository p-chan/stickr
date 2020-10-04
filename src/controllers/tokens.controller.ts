import { Middleware, SlackCommandMiddlewareArgs, SlackViewMiddlewareArgs } from '@slack/bolt'
import { userRepository } from '../repositories'
import { AddTokenModalComponent } from '../views'

export const openAddModal: Middleware<SlackCommandMiddlewareArgs> = async ({ ack, client, command }) => {
  try {
    await client.views.open({
      trigger_id: command.trigger_id,
      view: AddTokenModalComponent({ channelId: command.channel_id, teamDomain: command.team_domain }),
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
    const xoxsToken = (body.view.state as any).values.primary.xoxs_token.value

    // token の有効性を検証する
    await client.auth.test({ token: xoxsToken })

    // token を永続化する
    await userRepository.upsert({ userId, teamId, xoxsToken })

    await client.chat.postEphemeral({
      channel: channelId,
      text: 'トークンを保存しました',
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
