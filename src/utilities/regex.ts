import { emojiPrefix } from './global-settings'

// スタンプ_1234_1234
export const isStickrEmojiNameRegex = new RegExp('^(' + emojiPrefix + '_)[0-9]+(_)[0-9]+$', 'g')

// :スタンプ_1234_1234:
export const isStickrEmojiNameWithColonRegex = new RegExp('^(:' + emojiPrefix + '_)[0-9]+(_)[0-9]+(:)$', 'g')

// :スタンプ_1234_1234_suffix:
export const isStickrEmojiNameWithSuffixAndColon = new RegExp(
  '^(:' + emojiPrefix + '_)[0-9]+(_)[0-9]+(_)[0-9a-zA-Z]+(:)$',
  'g'
)

// alias:スタンプ_1234_1234
export const isStickrEmojiAliasNameRegex = new RegExp('^(alias:' + emojiPrefix + '_)[0-9]+(_)[0-9]+$', 'g')
