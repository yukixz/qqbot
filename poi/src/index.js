import _ from 'lodash'
import { CQWebSocket, CQAt } from "cq-websocket"

const bot = new CQWebSocket({
  host: "127.0.0.1",
  port: 12452,
})
bot
  .on('socket.error', console.error)
  .on('socket.connecting', (wsType) => console.log(`[${wsType}] Connecting...`))
  .on('socket.connect', (wsType, _, attempts) => console.log(`[${wsType}] Connected in ${attempts} attempts`))
  .on('socket.failed', (wsType, attempts) => console.log(`[${wsType}] Connect failed on ${attempts} attempts`))
  .on('socket.close', (wsType, code, desc) => console.log(`[${wsType}] Connect close: ${code} ${desc}`))
  .on('ready', () => console.log(`QQBot ready`))
  .on('api.response', (resObj) => console.log('Response: %O', resObj))
  .connect()
  .on('message.group', (e, ctx) => {
    // poi & yuki
    if (ctx.group_id in [***REMOVED***, ***REMOVED***])
      return
    // no anonymous
    if (ctx.anonymous != null)
      return
    // roll
    if (ctx.message === "/roll") {
      const range = 100
      return `${new CQAt(ctx.user_id)} ${_.random(1, range)}/${range}`
    }
  })
