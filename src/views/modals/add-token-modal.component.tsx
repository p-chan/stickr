/** @jsx JSXSlack.h */
import { JSXSlack, Modal, Input, Context, Divider, Section } from '@speee-js/jsx-slack'

type Props = {
  channelId: string
  teamDomain: string
}

export const AddTokenModalComponent = (props: Props): any => {
  const privateMetadata = JSON.stringify({
    channelId: props.channelId,
  })

  return (
    <Modal
      title="スタンプを追加する"
      callbackId="submit_add_token_action"
      privateMetadata={privateMetadata}
      submit="追加する"
      close="閉じる"
    >
      <Input
        label="トークンを入れてください"
        placeholder="xoxs-xxxx-xxxx"
        blockId="primary"
        actionId="xoxs_token"
        required
      />
      <Divider />
      <Section>
        <p>
          <b>:bulb: ヒント</b>
        </p>
      </Section>
      <Section>
        <p>トークンとは？</p>
      </Section>
      <Context>
        トークンは <code>https://{props.teamDomain}.slack.com/customize/emoji</code> の HTML 内から <code>xoxs-</code>{' '}
        で検索をしたときにマッチする一連の文字列のことです。
      </Context>
    </Modal>
  )
}
