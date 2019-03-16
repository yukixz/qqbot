import { CQWebSocket } from 'cq-websocket'
import { CQHTTP_WS_HOST, CQHTTP_WS_PORT } from '@qqbot/utils'
import RollBot from './rollbot'

const QQ = new CQWebSocket({
  host: CQHTTP_WS_HOST,
  port: CQHTTP_WS_PORT,
})
QQ.on('ready', () => console.log(`QQBot ready`)).connect()

const Bots = [
  new RollBot(),
]
QQ.on('message.group', (e, ctx) => {
  // poi & yuki
  if (ctx.group_id in [***REMOVED***, ***REMOVED***])
    return
  for (const bot of Bots) {
    const ret = bot.handleGroupMsg(ctx)
    if (ret == null) continue   // return `null` to continue
    return ret                  // return anything to stop
  }
})

