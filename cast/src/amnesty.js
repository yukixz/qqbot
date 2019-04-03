import { Stewards } from '@qqbot/utils'
import BaseSkill from './base'
/* global QQ */

export default class Amnesty extends BaseSkill {
  static Name    = '大赦天下'
  static Aliases = [  ]
  static RequiredLevel = 9
  static Options = [ 
    { name: 'threshold', type: Number, default: 1 },  // days
  ]

  constructor(...args) {
    super(...args)
  }

  spell = async () => {
    this.active = true
    if (! Stewards.includes(this.caster_id))
      return await this.destory()
    this.active = true
    // QQ('send_group_msg_rate_limited', {
    //   group_id: this.group_id,
    //   message : `奉天承运群主诏曰 今日龙颜大悦 特大赦天下 汝等归家 洗心革面 重新做人 不可再犯 钦此`,
    // })
    this.release()
  }

  release = async () => {
    const threshold = this.threshold * 24 * 60 * 60
    const users = await QQ.getGroupBannedUsers(this.group_id)
    for (const [ user_id, bt ] of Object.entries(users)) {
      if (bt >= threshold)  continue
      console.log('set_group_ban_rate_limited', this.group_id, user_id)
      QQ('set_group_ban_rate_limited', {
        group_id: this.group_id,
        user_id : user_id,
        duration: 0,
      })
    }
    await this.destory()
  }
}