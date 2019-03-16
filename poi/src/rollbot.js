import _ from 'lodash'
import { CQAt } from 'cq-websocket'
import { textsplit } from '@qqbot/utils'

export default class RollBot {
  Lower = 2
  Upper = 9999
  Separator = ','

  handleGroupMsg(ctx) {
    const user = ctx.user_id
    const message = ctx.message.toLowerCase()
    const parts = textsplit(message)
    if (parts[0] !== '/roll')
      return

    let ranges = []
    for (const part of parts.slice(1, 6)) {
      // `/roll 100`
      const n = Number(part)
      if (!Number.isNaN(n)) {
        if (this.Lower <= n && n <= this.Upper) {
          ranges.push(n)
          continue
        } else {
          return `${new CQAt(user)} /roll 有效范围为 ${this.Lower}~${this.Upper}`
        }
      }
      // `/roll 1,20,100`
      const ns = part.split(this.Separator)
      if (ns.length > 1) {
        ranges.push(ns)
        continue
      }
      // Stop on non-valid roll parameter
      break
    }
    if (ranges.length === 0)
      ranges = [100]

    let rolls = []
    for (const range of ranges) {
      if (typeof range === 'number')
        rolls.push(`${_.random(1, range)}/${range}`)
      if (range instanceof Array)
        rolls.push(range[Math.floor(Math.random()*range.length)])
    }

   return [`[roll]`, new CQAt(user), ...rolls].join(' ')
  }
}