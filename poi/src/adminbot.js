import _ from 'lodash'
import { CQAt } from 'cq-websocket'
import { textmatch, textsplit } from '@qqbot/utils'
/* global QQ, DB */

const BanDefaultDuration =       1  // Minutes
const BanResetTime       = 20 * 60 * 60 * 1000  // Milliseconds
const IgnoredWords = [
  "傻",
  "笨",
  "蠢",
  "白痴",
  "智障",
  "弱智",
  "神经",
  "rbq",
  "肉便器",
  "公共便所",
  "强奸",
  "强暴",
]
const BannedWords = [
  {
    keywords: ["我要口球"],
    duration: 1,
  },
  {
    keywords: [],
    duration: 10 * 24 * 60,
  },
]

export default class AdminBot {
  BannedPattern   = /\((\d+)\) *被管理员禁言/
  UnbannedPattern = /\((\d+)\) *被管理员解除禁言/

  handleGroupMsg = async (ctx, tags) => {
    const group   = ctx.group_id
    const user    = ctx.user_id
    const message = ctx.message.toLowerCase()

    // Bypass Mini KanColle command
    // if (message[0] === '%')
    //   return BotBlock

    // SystemMessage: User banned
    if (user === '1000000') {
      const m = message.match(this.BannedPattern)
      if (m != null) {
        const bannedUser = parseInt(m[1])
        const record = await BanRecord.get(bannedUser)
        record.increase()
        await BanRecord.put(record)
        return
      }
    }

    // Ban words
    if (! await QQ.isGroupAdmin(group, user)) {
      const record = await BanRecord.get(user)
      for (let {keywords, duration} of BannedWords) {
        if (keywords == null) continue
        if (duration == null) duration = BanDefaultDuration
        duration *= record.multiplier
        if (textmatch(message, keywords)) {
          return ['set_group_ban', {
            group_id: ctx.group_id,
            user_id : ctx.user_id,
            duration: duration,
          }]
        }
      }
    }

    // Ignore words
    if (textmatch(message, IgnoredWords)) {
      return true
    }

    // Ban management
    if (await QQ.isGroupAdmin(group, user)) {
      const parts = textsplit(message)
      // if (parts[0] === '/bantop') {
      //   let n = Number(parts[1])
      //   if (Number.isNaN(n)) n = undefined
      //   const topN = await BanRecord.top(n)
      //   const texts = ["**** 禁言次数排名 ****"]
      //   for (const {user: qq, count} of topN) {
      //     // info.status = 0,-10
      //     // const info = await CQ.getGroupMemberInfo(group, qq, false)
      //     // const name = info.card || info.name
      //     texts.push(`${qq} ${count}`)
      //   }
      //   return texts.join('\n')
      // }
      if (parts[0] === '/banget' && tags[1] instanceof CQAt) {
        const { qq } = tags[1]
        const name = await QQ.getGroupMemberName(ctx.group_id, qq)
        const record = await BanRecord.get(qq)
        return `禁言次数：${name} ${record.count}`
      }
    }
    // if (Stewards.includes(user)) {
    //   const parts = textsplit(message)
    //   if (parts[0] === '/banset') {
    //     const at = CQAt.parse(parts[1])
    //     const n = Number(parts[2])
    //     if (at != null && !Number.isNaN(n)) {
    //       const {qq} = at
    //       const info = await CQ.getGroupMemberInfo(group, qq, false)
    //       const record = await BanRecord.get(qq)
    //       record.last  = Date.now()
    //       record.count = n
    //       await BanRecord.put(record)
    //       CQ.sendGroupMsg(group, `设置禁言次数：${info.name} ${record.count}`)
    //     } else {
    //       CQ.sendGroupMsg(group, `Error parsing command parameters`)
    //     }
    //     return BotBlock
    //   }
    // }
  }
}

class BanRecord {
  constructor(arg) {
    if (typeof arg === 'number') {
      this.user  = arg
      this.last  = Date.now()
      this.count = 0
    }
    if (typeof arg === 'object') {
      if ((Date.now() - arg.last) > BanResetTime)
        return new BanRecord(arg.user)
      this.user  = arg.user
      this.last  = arg.last
      this.count = arg.count >= 0 ? arg.count : 0
    }
  }
  increase() {
    this.count += 1
    this.last = Date.now()
  }
  decrease() {
    this.count -= 1
  }
  get multiplier() {
    const multiplier = Math.pow(this.count, 2)
    return multiplier > 1 ? multiplier : 1
  }

  static async put(record) {
    const key = `BanRecord-${record.user}`
    await DB.put(key, record)
  }
  static async get(user) {
    const key = `BanRecord-${user}`
    try {
      const raw = await DB.get(key)
      return new BanRecord(raw)
    }
    catch (err) {
      if (err.notFound)
        return new BanRecord(user)
      throw err
    }
  }
  static async top(n=3) {
    let records = _.map(await DB.getAll(),
      (raw, key) => key.match(/^BanRecord-\d+$/) ? new BanRecord(raw) : null)
    records = records.filter(r => r && r.count > 0)
    records = records.sort((a, b) => b.count - a.count)  // Sort from bigger to smaller
    return records.slice(0, n)
  }
}
