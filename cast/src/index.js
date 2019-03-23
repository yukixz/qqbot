import { CQWebSocket } from 'cq-websocket'
import { CQHTTP_WS_HOST, CQHTTP_WS_PORT, injectCQWS } from '@qqbot/utils'
import { IgnoreUsers, PoiGroups } from '@qqbot/utils'
import { splittext } from '@qqbot/utils'
import { initStore, getStore, putStore } from './store'
import BanUser from './ban'

initStore('./db')

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

const SkillMap = {}
for (const Skill of [ BanUser ]) {
  for (const name of [Skill.Name, ...Skill.Aliases]) {
    SkillMap[name] = Skill
  }
}

const activeSkills = []
QQ.on('message.group', async (e, ctx) => {
  const { user_id, group_id, message } = ctx
  const parts = splittext(message)
  if (IgnoreUsers.includes(user_id))
    return
  if (! PoiGroups.includes(group_id))
    return
  if (! parts[0] === "/cast")
    return
  console.log(`message.group ${ctx.group_id} ${ctx.user_id} ${ctx.message}`)

  const g = await getStore(group_id, {
    group_id: group_id,
  })

  const [ cast, name, ...args ] = parts
  const Skill = SkillMap[name]
  const skill = new Skill(args, ctx)
  activeSkills.push(skill)



  await putStore(group_id, g)
})
