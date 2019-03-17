import { CQWebSocket } from 'cq-websocket'
import { CQHTTP_WS_HOST, CQHTTP_WS_PORT, injectCQWS } from '@qqbot/utils'
import RepeatBot from './repeatbot'
import RollBot from './rollbot'

injectCQWS(CQWebSocket)
const QQ = new CQWebSocket({
  host: CQHTTP_WS_HOST,
  port: CQHTTP_WS_PORT,
})
QQ.on('ready', () => console.log(`QQBot ready`)).connect()

// Export constant `QQ` to global scope
Object.defineProperty(global, 'QQ', {
  get: () => { return QQ },
  set: () => { throw TypeError('Assignment to constant variable.') },
})

const Bots = [
  new RollBot(),
  new RepeatBot(),
]
QQ.on('message.group', async (e, ctx) => {
  // poi & yuki
  if (ctx.group_id in [***REMOVED***, ***REMOVED***])
    return
  for (const bot of Bots) {
    const ret = await bot.handleGroupMsg(ctx)

    // return `null` to continue
    if (ret == null) continue

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

