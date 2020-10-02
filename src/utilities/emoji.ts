export const convertWithColon = (text: string) => {
  return `:${text}:`
}

export const convertWithoutColon = (text: string) => {
  return text.replace(/:/g, '')
}

export const parse = (text: string) => {
  const [prefix, productId, stickerId, suffix] = convertWithoutColon(text).split('_')

  return {
    prefix,
    productId,
    stickerId,
    suffix,
  }
}

export const stringify = ({
  prefix,
  productId,
  stickerId,
  suffix,
}: {
  prefix: string
  productId: string
  stickerId: string
  suffix?: string
}) => {
  const suffixIfNeeded = suffix ? `_${suffix}` : ''

  return `${prefix}_${productId}_${stickerId}${suffixIfNeeded}`
}
