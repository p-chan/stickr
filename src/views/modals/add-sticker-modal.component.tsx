/** @jsx JSXSlack.h */
import { JSXSlack, Modal, Input, Context, Divider, Section } from '@speee-js/jsx-slack'

type Props = {
  channelId: string
}

export const AddStickersModalComponent = (props: Props): any => {
  const privateMetadata = JSON.stringify({
    channelId: props.channelId,
  })

  return (
    <Modal
      title="スタンプを追加する"
      callbackId="submit_add_stickers_action"
      privateMetadata={privateMetadata}
      submit="追加する"
      close="閉じる"
    >
      <Input
        label="スタンプの ID を入れてください"
        placeholder="1234"
        blockId="primary"
        actionId="product_id"
        required
      />
      <Input
        label="絵文字名のサフィックスを入れてください"
        placeholder="example"
        blockId="secondary"
        actionId="suffix"
        required
      />
      <Context>※ あとからの変更はできません</Context>
      <Divider />
      <Section>
        <p>
          <b>:bulb: ヒント</b>
        </p>
      </Section>
      <Section>
        <p>スタンプ ID とは？</p>
      </Section>
      <Context>
        スタンプの ID とは、追加したい LINE スタンプの ID です。 例えば、追加したい LINE スタンプの URL が{' '}
        <code>https://store.line.me/stickershop/product/1234/ja</code> だったとき、スタンプ ID は <code>1234</code>{' '}
        となります。
      </Context>
      <Section>
        <p>サフィックスとは？</p>
      </Section>
      <Context>
        サフィックスとは、絵文字名の末尾に付ける文字列のことです。 例えば、 <code>example</code>{' '}
        というサフィックスを付けると、絵文字名は <code>:スタンプ_1234_5678_example:</code>{' '}
        のようになり、絵文字入力時に簡単に絞り込むことができるようになります。
      </Context>
    </Modal>
  )
}
