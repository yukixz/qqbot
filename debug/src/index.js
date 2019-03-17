import { CQWebSocket } from 'cq-websocket'
import { CQHTTP_WS_HOST, CQHTTP_WS_PORT, injectCQWS } from '@qqbot/utils'

injectCQWS(CQWebSocket)
const QQ = new CQWebSocket({
  host: CQHTTP_WS_HOST,
  port: CQHTTP_WS_PORT,
})
QQ.on('socket.error', console.error)
  .on('socket.connecting', (wsType) => console.log(`[${wsType}] Connecting...`))
  .on('socket.connect', (wsType, _, attempts) => console.log(`[${wsType}] Connected in ${attempts} attempts`))
  .on('socket.failed', (wsType, attempts) => console.log(`[${wsType}] Connect failed on ${attempts} attempts`))
  .on('socket.close', (wsType, code, desc) => console.log(`[${wsType}] Connect close: ${code} ${desc}`))
  .on('ready', () => console.log(`QQBot ready`))
  .on('api.response', (resObj) => console.log('Response: %O', resObj))
  .connect()
  .on('message.group', (e, ctx) => {
    console.log(ctx)
  })
  .on('message.private', async (e, ctx) => {
    console.log(ctx)
    return ctx.message
    // 以下提供三種方式將原訊息以原路送回
    // switch (Date.now() % 3) {
    // case 0:
    //   // 1. 調用 CoolQ HTTP API 之 send_msg 方法
    //   bot('send_msg', ctx)
    //   break
    // case 1:
    //   // 2. 或者透過返回值快速響應
    //   return ctx.message
    // case 2:
    //   // 3. 或者透過CQEvent實例，先獲取事件處理權再設置響應訊息
    //   e.stopPropagation()
    //   e.setMessage(ctx.message)
    //   break
    // }
  })
