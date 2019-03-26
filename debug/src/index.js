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
  })
