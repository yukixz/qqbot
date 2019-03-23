export function textsplit(text) {
  return text.split(/\s+/)
}

export function textmatch(text, keywords) {
  if (keywords == null || keywords === '')
    return false
  if (typeof keywords === 'string')
    keywords = [ keywords ]
  for (const keyword of keywords)
    if (text.includes(keyword))
      return true
  return false
}

export function choice(array) {
  return array[Math.floor(Math.random() * array.length)]
}
