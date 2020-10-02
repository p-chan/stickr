import cheerio from 'cheerio'
import fetch from 'isomorphic-unfetch'

type Product = {
  id: string
  name: string
  stickers: Sticker[]
}

type Sticker = {
  id: string
  url: string
}

export const getProduct = async (id: string) => {
  return await fetch(`https://store.line.me/stickershop/product/${id}/ja`).then(async (response) => {
    if (!response.ok) throw new Error('LINE STORE へのアクセスに失敗しました')

    const $ = cheerio.load(await response.text())

    const product: Product = {
      id: id,
      name: $('.mdCMN38Item01Ttl').text(),
      stickers: [],
    }

    $('.FnStickerPreviewItem').each((_, element) => {
      const json = JSON.parse(element.attribs['data-preview'])

      product.stickers.push({
        id: json.id,
        url: json.staticUrl,
      })
    })

    if (!product.stickers.length) throw new Error('スタンプが存在しません')

    return product
  })
}
