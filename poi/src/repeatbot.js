import _ from 'lodash'
import { IgnoreUsers } from '@qqbot/utils'

export default class RepeatBot {
  QueueSize = 20
  RepeatMinLen = 6
  RepeatMinCount = 2
  RepeatMaxCount = 4

  constructor() {
    this.queue = []
    this.rq1 = new RandomQueue([true, false, false], 2)
  }

  async handleGroupMsg(ctx) {
    const user = ctx.user_id
    const message = ctx.message
    if (IgnoreUsers.includes(user))
      return

    // Find and Remove recorded message
    const i = this.queue.findIndex(m => m.text === message)
    const msg = (i > -1) ? this.queue.splice(i)[0] : new QueueMessage(message)

    // Add current to senders & Update repeat count
    msg.senders.add(user)
    msg.count = msg.senders.size

    // Push message to queue
    this.queue.unshift(msg)
    while (this.queue > this.QueueSize)
      this.queue.pop()

    // Repeat message
    if (!msg.repeated && msg.count >= this.RepeatMinCount &&
        _.random(this.RepeatMaxCount - this.count) <= 0) {
      msg.repeated = true
      if (msg.text.length >= this.RepeatMinLen) {
        return message
      }
    }

    // Ban4 event
    // if (msg.repeated && this.rq1.pop()) {
    //   return ['set_group_ban', {
    //     group_id: ctx.group_id,
    //     user_id : ctx.user_id,
    //     duration: 60,
    //   }]
    // }
    // if (config.SPBanUsers.includes(user) && this.rq2.pop()) {
    //   const minutes = Math.ceil(Math.random() * 6)
    //   CQ.setGroupBan(group, user, minutes)
    // }
  }
}

class QueueMessage {
  constructor(text) {
    this.text     = text
    this.count    = 0
    this.senders  = new Set()
    this.repeated = false
  }
}

class RandomQueue {
  constructor(defaults=[true, false], times=1) {
    this.defaults = defaults
    this.times    = times
    this.queue    = []
  }
  pop() {
    if (this.queue.length === 0)
      this.queue = _.shuffle(_.flatten(Array(this.times).fill(this.defaults)))
    return this.queue.pop()
  }
}
