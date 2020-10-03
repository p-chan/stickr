/** @jsx JSXSlack.h */
import { JSXSlack, Blocks, Section, Field } from '@speee-js/jsx-slack'

import { globalSettings } from '../../utilities'

type SubCommand = {
  example: string
  description: string
}

const subCommand: SubCommand[] = [
  {
    example: `${globalSettings.slashCommand} add [ID]`,
    description: 'スタンプを追加します',
  },
  {
    example: `${globalSettings.slashCommand} token [XOXS_TOKEN]`,
    description: '新しいトークンを設定します',
  },
  {
    example: `${globalSettings.slashCommand} mapping`,
    description: 'エイリアスのマッピングを更新します',
  },
  {
    example: `${globalSettings.slashCommand} help`,
    description: 'ヘルプを表示します',
  },
]

export const HelpComponent = (): any => {
  const subCommandElements = subCommand.map(({ example, description }) => {
    return (
      <Field>
        <code>{example}</code>
        <br />
        {description}
      </Field>
    )
  })

  return (
    <Blocks>
      <Section>
        <b>ヘルプ</b>
      </Section>
      <Section>
        <b>サブコマンド一覧</b>
      </Section>
      <Section>{subCommandElements}</Section>
      <Section>
        <b>トークンとは</b>
      </Section>
      <Section>
        <code>https://[TEAM_NAME].slack.com/customize/emoji</code> の HTML 内から <code>xoxs-</code>{' '}
        で検索をしたときにマッチする一連の文字列のことです。
      </Section>
    </Blocks>
  )
}
