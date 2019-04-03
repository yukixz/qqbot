import _ from 'lodash'
import { CQWebSocket, CQAt } from 'cq-websocket'
import { CQHTTP_WS_HOST, CQHTTP_WS_PORT, injectCQWS } from '@qqbot/utils'
import { IgnoreUsers, PoiGroups, Stewards } from '@qqbot/utils'
import { textsplit } from '@qqbot/utils'
import { initStore, getStore, putStore } from './store'
import Amnesty from './amnesty'
import BanUser from './ban'
import BanTrap from './trap'

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

const Skills = [ Amnesty, BanUser, BanTrap ]
const SkillMap = {}
for (const Skill of Skills) {
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
  if (user_id === 1000000)
    return
  console.log(`message.group ${ctx.group_id} ${ctx.user_id} ${ctx.message}`)

  const r = runtimes[group_id] || {
    skills: [],
    listts: 0,
  }
  const g = await getStore(group_id, {
    group_id: group_id,
    users: {},
  })
  const u = g.users[user_id] || {
    skills: {},
  }
  const user_lv = await QQ.getGroupMemberLevel(group_id, user_id)

  // Query all skills
  if (message === '/cast list' && Date.now() >= r.listts + 5*60*1000) {
    r.listts = Date.now()
    return [
      '【技能列表】',
      ...Object.entries(SkillMap).map(([name, Skill]) => `${name} Lv.${Skill.RequiredLevel}`),
    ].join('\n')
  }
  // Query group member level summary
  if (message === '/cast stat' && Stewards.includes(user_id)) {
    r.listts = Date.now()
    const ulvs = await QQ.getGroupMemberLevelAll(group_id)
    const lvc = _.countBy(ulvs)
    return [
      '【等级统计】',
      ...Object.keys(lvc).sort().reverse().map(lv => `Lv.${lv} ${lvc[lv]}`),
    ].join('\n')
  }

  // Cast new skill
  let is_cast = false
  const [ cast_cmd, cast_name, ...cast_args ] = textsplit(message)
  if (cast_cmd === '/cast' && SkillMap[cast_name] != null) {
    const nowts = Date.now()
    const Skill = SkillMap[cast_name]
    const user_skill = u.skills[Skill.name] || {
      castts: 0,
    }
    const admin = Stewards.includes(user_id) || await QQ.isGroupAdmin(group_id, user_id)
    if (!admin && user_lv < Skill.RequiredLevel)
      return `${new CQAt(user_id)}\n【${cast_name}】需要群活跃等级Lv.${Skill.RequiredLevel}，您当前等级Lv.${user_lv}`
    if (!admin && nowts <= (user_skill.castts + Skill.Cooldown * 60000)) {
      const rt = new Date(user_skill.castts + Skill.Cooldown * 60000 - nowts)
      return `${new CQAt(user_id)}\n【${cast_name}】冷却中，还有${rt.toISOString().substr(11,8)}`
    }

    console.log(`CAST group:${group_id} caster:${user_id} level:${user_lv} skill:${cast_name}`)
    is_cast = true
    user_skill.castts = nowts
    const skill = new Skill(cast_args, ctx)
    await skill.spell()

    r.skills.push(skill)
    u.skills[Skill.name] = user_skill
  }

  // Handle active skills
  if (! is_cast) {
    for (const s of r.skills) {
      if (s.active && s.handleMsg != null)
        await s.handleMsg(ctx, args)
    }
  }

  // Clean inactive skill
  r.skills = r.skills.filter(s => s.active)
  if (r.skills.length > 0)
    console.log(r.skills.map(s => {
      if (s instanceof BanUser)
        return `BanUser group:${s.group_id} caster:${s.caster_id} duration:${s.duration} target:${s.target_id}`
      if (s instanceof BanTrap)
        return `BanTrap group:${s.group_id} caster:${s.caster_id} duration:${s.duration} dies:${s.dies.queue}`
    }))

  runtimes[group_id] = r
  g.users[user_id] = u
  await putStore(group_id, g)
})
