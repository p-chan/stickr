import { Middleware, SlackCommandMiddlewareArgs } from '@slack/bolt'
import { userRepository } from '../repositories'

export const register: Middleware<SlackCommandMiddlewareArgs> = async ({ client, command }) => {
  const channelId = command.channel_id
  const teamId = command.team_id
  const userId = command.user_id

  try {
    const xoxsToken = command.text.split(' ')[1]

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
