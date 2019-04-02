import { CQAt } from 'cq-websocket'
import BaseSkill from './base'
/* global QQ */

export default class BanUser extends BaseSkill {
  static Name    = '炎爆术'
  static Aliases = [ '大火球' ]
  static RequiredLevel = 6
  static RequiredMana  = 10
  static Cooldown      = 24 * 60
  static Options = [
    { name: 'target'  , type: CQAt },
    { name: 'duration', type: Number, default: 1 },   // hours
  ]

  constructor(...args) {
    super(...args)
    this.target_id = this.target.qq
  }

  spell = async () => {
    this.active = true
    if (!await QQ.isGroupAdmin(this.group_id, this.target_id)) {
      QQ('set_group_ban', {
        group_id: this.group_id,
        user_id : this.target_id,
        duration: this.duration * 60 * 60,
      })
    }
    await this.destory()
  }
}