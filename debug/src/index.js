import { CQWebSocket } from 'cq-websocket'
import { CQHTTP_WS_HOST, CQHTTP_WS_PORT, injectCQWS } from '@qqbot/utils'
import { IgnoreUsers } from '@qqbot/utils'

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
    set: () => { throw TypeError('Assignment to constant variable.') },
  })
}

QQ.on('message.group', async (e, ctx, ...args) => {
  if (IgnoreUsers.includes(ctx.user_id))
    return
  console.log(`message.group ${ctx.group_id} ${ctx.user_id} ${ctx.message}`)

  console.log('======== ========')
  console.log(ctx)
  console.log(args)
})
