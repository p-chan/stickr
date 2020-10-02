import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'

export const addEmoji = async ({ name, file, token }: { name: string; file: fs.ReadStream; token: string }) => {
  const form: any = new FormData()

  form.append('mode', 'data')
  form.append('name', name)
  form.append('image', file)

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      ...form.getHeaders(),
    },
  }

  return await axios.post('https://slack.com/api/emoji.add', form, config)
}

export const addEmojiAlias = async ({ name, aliasFor, token }: { name: string; aliasFor: string; token: string }) => {
  const form: any = new FormData()

  form.append('mode', 'alias')
  form.append('name', name)
  form.append('alias_for', aliasFor)

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      ...form.getHeaders(),
    },
  }

  return await axios.post('https://slack.com/api/emoji.add', form, config)
}
