import { App } from '@slack/bolt'
import { PrismaClient } from '@prisma/client'

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
          blocks: [createUserTokenSectionBlock({ hasToken: true, isVerify: isVerify.ok }), newTokenButtonBlock],
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
          blocks: [createUserTokenSectionBlock({ hasToken: true, isVerify: false }), newTokenButtonBlock],
        },
      })
    }
  })
}
