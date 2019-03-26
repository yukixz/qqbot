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
    this.target_id = this.target.qq
    this.ban()
  }

  ban = async () => {
    if (await QQ.isGroupAdmin(this.group_id, this.caster_id) &&
        !await QQ.isGroupAdmin(this.group_id, this.target_id)) {
      QQ('set_group_ban', {
        group_id: this.group_id,
        user_id : this.target_id,
        duration: this.duration * 60 * 60,
      })
    }
    this.destory()
  }
}