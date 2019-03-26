import { CQAt } from 'cq-websocket'
import { RandomQueue } from '@qqbot/utils'
import BaseSkill from './base'
/* global QQ */

export default class BanTrap extends BaseSkill {
  static Name    = '禁言陷阱'
  static Aliases = [ '大字爆' ]
  static Options = [
    { name: 'duration', type: Number, default: 1 },   // x 10 minutes
  ]

  constructor(args, ctx) {
    super(args, ctx)
    this.msgCount = 5
    this.banCount = 1
    this.enable()
  }

  enable = async () => {
    if (await QQ.isGroupAdmin(this.group_id, this.caster_id)) {
      this.dies = new RandomQueue(
        Array(this.msgCount).fill(0).map((_,i) => i < this.banCount), 1, false)
      QQ('set_group_ban_rate_limited', {
        group_id: this.group_id,
        user_id : this.caster_id,
        duration: this.duration * 10 * 60,
      })
      QQ('send_group_msg_rate_limited', {
        group_id: this.group_id,
        message : `${new CQAt(this.caster_id)} 释放了大字爆，请小心行走`,
      })
    }
    else
      this.destory()
  }

  handleMsg = async (ctx, tags) => {
    if (this.dies.isEmpty) {
      this.destory()
      return
    }
    const { group_id, user_id } = ctx
    if (this.dies.pop() && !await QQ.isGroupAdmin(group_id, user_id)) {
      QQ('set_group_ban_rate_limited', {
        group_id: group_id,
        user_id : user_id,
        duration: this.duration * 10 * 60,
      })
    }
  }
}