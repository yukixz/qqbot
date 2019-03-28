import moment from 'moment-timezone'
import request from 'request-promise-native'
import { CQWebSocket } from 'cq-websocket'
import { CQHTTP_WS_HOST, CQHTTP_WS_PORT } from '@qqbot/utils'
import { CONSUMER_KEY, CONSUMER_SECRET, ACCESS_KEY, ACCESS_TOKEN, Notifies } from './config'
/* global BigInt */  // HACK: stage-3 built-in object

const QQ = new CQWebSocket({
  host: CQHTTP_WS_HOST,
  port: CQHTTP_WS_PORT,
  enableEvent: false,
})
QQ.on('ready', () => log(`QQBot ready`)).connect()

let last_id = BigInt(0)
const oauth = {
  consumer_key   : CONSUMER_KEY,
  consumer_secret: CONSUMER_SECRET,
  token          : ACCESS_KEY,
  token_secret   : ACCESS_TOKEN,
}

function log(...args) {
  console.log((new Date()).toISOString(), ...args)
}

async function fetch(since_id=1) {
  // eslint-disable-next-line valid-typeof
  if (typeof since_id === 'bigint')
    since_id = since_id.toString()
  const resp = await request.get({
    url: 'https://api.twitter.com/1.1/statuses/home_timeline.json',
    qs: {
      count   : 200,
      since_id: since_id,
      tweet_mode: 'extended',
    },
    oauth: oauth,
    json: true,
  })
  return resp
}

async function init() {
  // log(`Fetch user id.`)
  // for (const [ screen_name, notify ] of Object.entries(Notifies)) {
  //   const resp = await request.get({
  //     url: 'https://api.twitter.com/1.1/users/show.json',
  //     qs: { screen_name },
  //     oauth: oauth,
  //     json: true,
  //   })
  //   notify.user_id = resp.id
  // }

  const timeline = await fetch()
  last_id = BigInt(timeline[0].id_str)
  log(`Last timeline id: ${last_id}`)
}

async function broadcast() {
  log(`Broadcast since id: ${last_id}`)
  const timeline = await fetch(last_id + 1n)
  for (const tweet of timeline.reverse()) {
    log(`Broadcasting ${tweet.id_str} @${tweet.user.screen_name}`)
    const tweet_id = BigInt(tweet.id_str)
    if (tweet_id > last_id)
      last_id = tweet_id

    let { name, screen_name } = tweet.user
    let _date = moment(tweet.created_at, "ddd MMM DD HH:mm:ss Z YYYY").tz('Asia/Tokyo')
    let date  = `${_date.format("YYYY-MM-DD HH:mm:ss")} JST`
    let text  = tweet.full_text || tweet.text
    for (const ent of tweet.entities.urls || []) {
      text = text.replace(ent.url, ent.expanded_url)
    }

    const notify = Notifies[screen_name]
    const message = [name, date, '', text].join('\n')
    console.log(message)
    if (notify == null)  continue
    for (const group_id of notify.groups) {
      QQ('send_group_msg_rate_limited', { group_id, message })
    }
  }
}

(async () => {
  await init()
  setInterval(broadcast, 60 * 1000)
  // setTimeout(broadcast, 0)
})()