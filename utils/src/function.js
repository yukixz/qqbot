import _ from 'lodash'

export function textsplit(text) {
  return text.split(/\s+/).filter(s => s.length > 0)
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

export class RandomQueue {
  constructor(defaults=[true, false], times=1, autoReload=true) {
    this.defaults   = defaults
    this.times      = times
    this.autoReload = autoReload
    this.reload()
  }
  get isEmpty() {
    return this.queue.length === 0
  }
  reload() {
    this.queue = _.shuffle(_.flatten(Array(this.times).fill(this.defaults)))
  }
  pop() {
    if (this.autoReload && this.isEmpty)
      this.reload()
    return this.queue.pop()
  }
}