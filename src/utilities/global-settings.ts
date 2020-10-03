import os from 'os'
import path from 'path'

export const emojiPrefix = 'スタンプ'
export const environment = process.env.NODE_ENV || 'development'
export const slashCommand = (() => {
  if (environment === 'production') return '/stickr'
  if (environment === 'development') return '/stickr-dev'

  return '/stickr'
})()
export const temporaryDirectoryPath = (() => {
  // GAE/SE は `/tmp` を指定しないと書き込めない
  if (environment === 'production') return path.resolve('/tmp', './stickr')
  if (environment === 'development') return path.resolve(process.cwd(), './tmp')

  return path.resolve(os.tmpdir(), '/stickr')
})()
