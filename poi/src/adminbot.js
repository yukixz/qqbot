import _ from 'lodash'
import { CQAt } from 'cq-websocket'
import { textmatch, textsplit } from '@qqbot/utils'
/* global QQ, DB */

const BanDefaultDuration =       1  // Minutes
const BanMaxDuration     = 16 * 60  // Minutes
const BanResetDuration   = 16 * 60 * 60 * 1000  // Milliseconds
const BanRedPacketMultiplier = 60
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
    duration: 1 * 60,
  },
]
BannedWords.unshift(...BannedWords.map(origin => {
  const bw = Object.assign({}, origin)
  bw.keywords = bw.keywords.map(s => `[CQ:hb,title=${s}]`)
  bw.duration = bw.duration * BanRedPacketMultiplier
  return bw
}))

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
    if (user === 1000000) {
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
        duration = duration > BanMaxDuration ? BanMaxDuration : duration
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
      if (parts[0] === '/bantop') {
        let n = Number(parts[1])
        if (Number.isNaN(n)) n = undefined
        const topN = await BanRecord.top(n)
        const texts = ["**** 禁言次数排名 ****"]
        for (const {user: qq, count} of topN) {
          const name = await QQ.getGroupMemberName(ctx.group_id, qq)
          texts.push(`${name} ${count}`)
        }
        return texts.join('\n')
      }
      if (parts[0] === '/banget' && tags[1] instanceof CQAt) {
        const { qq } = tags[1]
        const record = await BanRecord.get(qq)
        const name = await QQ.getGroupMemberName(ctx.group_id, qq)
        return `禁言次数：${name} ${record.count}`
      }
      if (parts[0] === '/banset' && tags[1] instanceof CQAt) {
        const { qq } = tags[1]
        const count = Number(parts[2])
        if (Number.isNaN(count)) return
        const record = await BanRecord.get(qq)
        record.last  = Date.now()
        record.count = count
        await BanRecord.put(record)
        const name = await QQ.getGroupMemberName(ctx.group_id, qq)
        return `设置禁言次数：${name} ${record.count}`
      }
    }
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
      if ((Date.now() - arg.last) > BanResetDuration)
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
    let records = await new Promise((resolve, reject) => {
      const ret = {}
      DB.createReadStream()
        .on('data' , ({key, value}) => ret[key] = value)
        .on('close',   () => resolve(ret))
        .on('end'  ,   () => resolve(ret))
        .on('error',  err => reject(err))
    })
    records = _.map(records, (raw, key) => key.match(/^BanRecord-\d+$/) ? new BanRecord(raw) : null)
    records = records.filter(r => r && r.count > 0)
    records = records.sort((a, b) => b.count - a.count)  // descending order
    return records.slice(0, n)
  }
}
