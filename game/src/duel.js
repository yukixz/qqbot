import _ from 'lodash'
import { CQAt } from 'cq-websocket'
/* global QQ */

export default class Duel {
  Name = "决斗"
  Aliases = ["solo", "不服solo"]

  JoinSeconds      = 60
  ConfirmSeconds   = 10
  FireSecondsLower = 5
  FireSecondsUpper = 15
  ForceSeconds     = 30
  DeadMinutes      = 60
  BulletLimit      = 2
  JoinMessages = ["加入", "参加", "join"]
  FireMessages = ["开火", "开枪", "fire"]
  QuitMessages = ["退出", "quit", "leave"]

  constructor() {
    this.inGame = false
    this.status = "Idle"  // Idle, Join, Confirm, Wait, Fire
    this.msgs   = []
  }
  setQQBan = async (user, minutes) => {
    if (! await QQ.isGroupAdmin(this.group, user)) {
      await QQ('set_group_ban', {
        group_id: this.group,
        user_id : user,
        duration: minutes * 60,
      })
    }
  }
  sendQQMsg = async (extra) => {
    if (extra != null) {
      this.msgs.push(extra)
    }
    if (this.msgs.length > 0) {
      const msgs = this.msgs.filter(s => s != null)
      await QQ('send_group_msg', {
        group_id: this.group,
        message : msgs.join('\n'),
      })
    }
    this.msgs = []
  }
  handleGroupMsg = async (ctx, tags) => {
    const { user_id: user, message } = ctx
    if (this.status === "Join") {
      if (this.JoinMessages.includes(message)) {
        await this.join(user)
      }
      if (this.QuitMessages.includes(message)) {
        await this.quit(user)
      }
    }
    if (this.status === "Confirm") {
      if (this.QuitMessages.includes(message)) {
        await this.quit(user)
      }
    }
    if (this.status === "Wait" || this.status === "Fire") {
      if (this.FireMessages.includes(message)) {
        await this.firePlayer(user)
      }
    }
  }
  open = async (g) => {
    this.inGame = true
    this.status = "Join"
    this.g       = g
    this.group   = g.Group
    this.players = []
    await this.sendQQMsg([
      `生死看淡，不服就干！`,
      `决斗将在 ${this.JoinSeconds} 秒后开始。`,
      `参加：${this.JoinMessages.join('/')}`,
      `退出：${this.QuitMessages.join('/')}`,
      `开枪：${this.FireMessages.join('/')}`,
    ].join('\n'))
    this.tid = setTimeout(this.start, this.JoinSeconds * 1000)
  }
  cancel = async () => {
    clearTimeout(this.tid)
    this.inGame = false
    this.status = "Idle"
    await this.sendQQMsg(`${this.Name}已取消`)
  }
  join = async (user, invitee) => {
    // User must be NOT in game
    if (this.players.find(p => p.qq === user) != null) return
    if (this.invitee == null) {
      if (invitee == null) {
        this.msgs.push(`${new CQAt(user)}参加决斗`)
        this.players.push({
          qq: user,
          bullet: 0,
        })
        if (this.players.length >= 2)
          await this.start()
        else
          await this.sendQQMsg()
      } else {
        // pass
      }
    }
  }
  quit = async (user) => {
    // User must be in game
    if (this.players.find(p => p.qq === user) == null) return
    this.msgs.push(`${new CQAt(user)}临阵逃脱了！`)
    // Refactor these if supporting more than two players
    if (this.status === "Confirm")
      await this.cancel()
  }
  start = async () => {
    clearTimeout(this.tid)
    if (this.players.length < 2) {
      this.inGame = false
      this.status = "Idle"
      await this.sendQQMsg(`参加人数不足，${this.Name}已取消。`)
    } else {
      this.status = "Confirm"
      this.msgs.push(`决斗确认：${this.players.map(p => new CQAt(p.qq)).join(' ')}`)
      this.msgs.push(`若不参加，请在 ${this.ConfirmSeconds} 秒内退出`)
      this.tid = setTimeout(this.confirm, this.ConfirmSeconds * 1000)
      await this.sendQQMsg()
    }
  }
  end = async () => {
    this.inGame = false
    this.status = "Idle"
    await this.sendQQMsg()
  }
  confirm = async () => {
    clearTimeout(this.tid)
    this.status = "Wait"
    await this.sendQQMsg(`将在${this.FireSecondsLower}~${this.FireSecondsUpper}秒后发出开枪指令，请及时开枪！`)
    const seconds = _.random(this.FireSecondsLower, this.FireSecondsUpper, true)
    this.tid = setTimeout(this.fire0, seconds * 1000)
  }
  fire0 = async () => {
    clearTimeout(this.tid)
    this.status = "Fire"
    await this.sendQQMsg(`开枪！`)
    this.tid = setTimeout(this.force, this.ForceSeconds * 1000)
  }
  firePlayer = async (user) => {
    // Bypass user not in game
    const player = this.players.find(p => p.qq === user)
    if (player == null) return
    // Bypass player used all bullet
    player.bullet += 1
    if (player.bullet > this.BulletLimit)
      return

    if (this.status === "Fire") {
      clearTimeout(this.tid)
      const killed = this.players.filter(p => p.qq !== user)
      for (const player of killed)
        this.setQQBan(player.qq, this.DeadMinutes)
      const killedMsg = killed.map(p => new CQAt(p.qq)).join('、')
      this.msgs.push(`${new CQAt(user)}以迅雷不及掩耳之势掏出手枪，击毙了对手${killedMsg}！`)
      await this.end()
    }
    else if (player.bullet === this.BulletLimit) {
      await this.sendQQMsg(`${new CQAt(user)} 你用掉了最后一颗子弹`)
    }
  }
  force = async () => {
    clearTimeout(this.tid)
    for (const player of this.players)
      this.setQQBan(player.qq, this.DeadMinutes)
    this.msgs.push(`决斗双方犹豫不决，吃瓜群众掏出机枪一顿扫射。`)
    await this.end()
  }
}