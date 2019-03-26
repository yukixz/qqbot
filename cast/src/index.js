import { CQWebSocket } from 'cq-websocket'
import { CQHTTP_WS_HOST, CQHTTP_WS_PORT, injectCQWS } from '@qqbot/utils'
import { IgnoreUsers, PoiGroups } from '@qqbot/utils'
import { textsplit } from '@qqbot/utils'
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

const runtimes = []
QQ.on('message.group', async (e, ctx, ...args) => {
  const { user_id, group_id, message } = ctx
  if (IgnoreUsers.includes(user_id))
    return
  if (! PoiGroups.includes(group_id))
    return
  console.log(`message.group ${ctx.group_id} ${ctx.user_id} ${ctx.message}`)

  const g = await getStore(group_id, {
    group_id: group_id,
  })
  const r = runtimes[group_id] || {
    skills: [],
  }

  // Cast new skill
  const parts = textsplit(message)
  if (parts[0] === '/cast') {
    const [ _, name, ...castArgs ] = parts
    const Skill = SkillMap[name]
    const skill = new Skill(castArgs, ctx)
    r.skills.push(skill)
  }
  // Handle active skills
  else {
    for (const s of r.skills) {
      if (s.active && s.handleMsg != null)
        await s.handleMsg(ctx, args)
    }
  }
  // Clean inactive skill
  console.log(r)
  r.skills = r.skills.filter(s => s.active)

  await putStore(group_id, g)
})
