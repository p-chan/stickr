import os from 'os'
import path from 'path'

export const stickrEmojiPrefix = 'スタンプ'
export const stickrEnvironment = process.env.NODE_ENV || 'development'
export const stickrSlashCommand = (() => {
  if (stickrEnvironment === 'production') return '/stickr'
  if (stickrEnvironment === 'development') return '/stickr-dev'

  return '/stickr'
})()
export const stickrTemporaryDirectoryPath = (() => {
  // GAE/SE は `/tmp` を指定しないと書き込めない
  if (stickrEnvironment === 'production') return path.resolve('/tmp', './stickr')
  if (stickrEnvironment === 'development') return path.resolve(process.cwd(), './tmp')

  return path.resolve(os.tmpdir(), '/stickr')
})()
