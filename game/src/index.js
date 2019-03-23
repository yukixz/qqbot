import { CQWebSocket } from 'cq-websocket'
import { CQHTTP_WS_HOST, CQHTTP_WS_PORT, injectCQWS } from '@qqbot/utils'
import { Stewards, IgnoreUsers, PoiGroups } from '@qqbot/utils'
import Duel from './duel'
import RussianRoulette from './russian'

injectCQWS(CQWebSocket)
const QQ = new CQWebSocket({
  host: CQHTTP_WS_HOST,
  port: CQHTTP_WS_PORT,
})
QQ.on('ready', () => console.log(`QQBot ready`)).connect()

// Export constants to global scope
for (const [k, v] of [['QQ', QQ]]) {
  Object.defineProperty(global, k, {
    get: () => { return v },
    set: () => { throw new TypeError('Assignment to constant variable.') },
  })
}

const GroupStores = {}
function getGroupStore(group) {
  if (GroupStores[group] != null)
    return GroupStores[group]

  const g = {
    Group: group,
    Bots: [
      new Duel(),
      new RussianRoulette(),
    ],
    OpenMap: {},
  }
  for (const bot of g.Bots) {
    let msgs = []
    if (bot.Name == null) {
      console.error(`${bot.constructor.name} has no name.`)
      continue
    } else {
      msgs.push(bot.Name)
    }
    if (bot.Aliases instanceof Array) {
      msgs = msgs.concat(bot.Aliases)
    }
    for (const msg of msgs) {
      if (g.OpenMap[msg] != null) {
        console.error(`${bot.constructor.name} has open messages same as others.`)
        continue
      }
      g.OpenMap[msg] = bot
    }
  }

  GroupStores[group] = g
  return g
}
function adminCommand(ctx) {
  if (ctx.message === '/gin') {
    const texts = []
    for (const g of Object.values(GroupStores)) {
      const bot = g.Bots.find(b => b.inGame)
      if (bot != null)
        texts.push(`${g.Group} ${bot.Name}`)
    }
    return (texts.length > 0) ? texts.join('\n') : 'No game'
  }
  if (ctx.message === '/gcc') {
    for (const g of Object.values(GroupStores)) {
      for (const b of g.Bots) {
        b.inGame = false
        clearTimeout(b.tid)
      }
    }
    return `All game cancelled.`
  }
}

QQ.on('message.group', async (e, ctx, ...args) => {
  const { user_id: user, group_id: group, message } = ctx
  // Restriction
  if (IgnoreUsers.includes(user))
    return
  if (! PoiGroups.includes(group))
    return
  console.log(`message.group ${ctx.group_id} ${ctx.user_id} ${ctx.message}`)

  const g = getGroupStore(group)
  try {
    // Stewards' Commands
    if (Stewards.includes(user)) {
      const text = adminCommand(ctx, ...args)
      if (text != null) {
        return text
      }
    }
    const gameBot = g.Bots.find(b => b.inGame)
    const openBot = g.OpenMap[message]
    // Open game
    if (openBot != null) {
      if (gameBot != null) {
        return `正在进行游戏：${gameBot.Name}`
      } else {
        await openBot.open(g)
        return true
      }
    }
    // Game message
    if (gameBot != null) {
      return await gameBot.handleGroupMsg(ctx, ...args)
    }
  }
  catch (err) {
    console.error(`Unhandled Error in ${group}`, '\n', err.stack)
  }
})
