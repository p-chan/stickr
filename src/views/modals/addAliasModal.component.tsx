/** @jsx JSXSlack.h */
import { JSXSlack, Modal, Input } from '@speee-js/jsx-slack'

type Props = {
  altText: string
  channelId: string
}

export const AddAliasModalComponent = (props: Props): any => {
  const privateMetadata = JSON.stringify({
    altText: props.altText,
    channelId: props.channelId,
  })

  return (
    <Modal
      title="エイリアスを追加する"
      callbackId="submit_add_alias_action"
      privateMetadata={privateMetadata}
      submit="追加する"
      close="閉じる"
    >
      <Input
        blockId="primary"
        label="エイリアスの名前を入れてください"
        placeholder="alias"
        actionId="alias_name"
        required
      />
    </Modal>
  )
}
