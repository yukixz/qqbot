import { CQAt } from 'cq-websocket'
import BaseSkill from './base'
/* global QQ */

export default class BanUser extends BaseSkill {
  static Name    = '禁言术'
  static Aliases = [ '禁言' ]
  static Options = [
    { name: 'target'  , type: CQAt },
    { name: 'duration', type: Number, default: 1 },   // hours
  ]

  constructor(args, ctx) {
    super(args)
    this.active = false

    const { group_id, user_id } = ctx
    const target_id = this.target.qq
    if (QQ.isGroupAdmin(group_id, user_id) && !QQ.isGroupAdmin(group_id, target_id)) {
      QQ('set_group_ban', {
        group_id: group_id,
        user_id : target_id,
        duration: this.duration * 60 * 60,
      })
    }
  }
}