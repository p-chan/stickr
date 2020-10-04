/** @jsx JSXSlack.h */
import { JSXSlack, Blocks, Section, Field } from '@speee-js/jsx-slack'

import { globalSettings } from '../../utilities'

type SubCommand = {
  example: string
  description: string
}

const subCommand: SubCommand[] = [
  {
    example: `${globalSettings.slashCommand} add`,
    description: 'スタンプを追加するモーダルを起動します',
  },
  {
    example: `${globalSettings.slashCommand} token`,
    description: 'トークンを設定するモーダルを起動します',
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
      <Section>{subCommandElements}</Section>
    </Blocks>
  )
}
