/** @jsx JSXSlack.h */
import { JSXSlack, Blocks, Section, Image, Context } from '@speee-js/jsx-slack'

type Props = {
  stickerImageUrl: string
  stickerAltText: string
  profileImageUrl: string
  displayName: string
}

export const StickerComponent = (props: Props): any => {
  return (
    <Blocks>
      <Image src={props.stickerImageUrl} alt={props.stickerAltText} />
      <Context>
        <img src={props.profileImageUrl} alt={props.displayName} /> Posted by {props.displayName}
      </Context>
    </Blocks>
  )
}
