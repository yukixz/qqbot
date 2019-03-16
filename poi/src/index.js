import _ from 'lodash'
import { CQWebSocket, CQAt } from 'cq-websocket'
import { CQHTTP_WS_HOST, CQHTTP_WS_PORT } from '@qqbot/utils'

const bot = new CQWebSocket({
  host: CQHTTP_WS_HOST,
  port: CQHTTP_WS_PORT,
})
bot.on('ready', () => console.log(`QQBot ready`)).connect()
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
