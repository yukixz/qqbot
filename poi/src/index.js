import level from 'level'
import { CQWebSocket } from 'cq-websocket'
import { CQHTTP_WS_HOST, CQHTTP_WS_PORT, injectCQWS } from '@qqbot/utils'
import AdminBot from './adminbot'
import RepeatBot from './repeatbot'
import RollBot from './rollbot'

injectCQWS(CQWebSocket)
const QQ = new CQWebSocket({
  host: CQHTTP_WS_HOST,
  port: CQHTTP_WS_PORT,
})
QQ.on('ready', () => console.log(`QQBot ready`)).connect()

const DB_PATH = './db'
const DB = level(DB_PATH, {
  keyEncoding  : 'utf8',
  valueEncoding: 'json',
})

// Export constants to global scope
for (const [k, v] of [['QQ', QQ], ['DB', DB]]) {
  Object.defineProperty(global, k, {
    get: () => { return v },
    set: () => { throw TypeError('Assignment to constant variable.') },
  })
}

const Bots = [
  new AdminBot(),
  new RollBot(),
  new RepeatBot(),
]
QQ.on('message.group', async (e, ctx, ...args) => {
  // poi & yuki
  if (![***REMOVED***, ***REMOVED***].includes(ctx.group_id))
    return
  console.log(`message.group ${ctx.group_id} ${ctx.user_id} ${ctx.message}`)
  for (const bot of Bots) {
    const ret = await bot.handleGroupMsg(ctx, ...args)

    // return `null` to continue
    if (ret == null) continue

    // return `true` to stop
    if (ret == true) return

    // return string to reply & stop
    if (typeof ret === 'string')
      return ret

    // return Array[method, content] to call & stop
    if (ret instanceof Array) {
      const [ method, content ] = ret
      QQ(method, content)
      return
    }
  }
})

