// Inject utilities to CQWebSocket

import _ from 'lodash'
import request from 'request-promise-native'
import NodeCache from 'node-cache'

const cache = new NodeCache({
  stdTTL: 24 * 60 * 60,
  checkperiod: 0,
  errorOnMissing: false,
  useClones     : true,
  deleteOnExpire: true,
})

async function _refreshGroupMember(group_id) {
  if (group_id == null)  return false
  if (cache.getTtl(`GroupMember:${group_id}`) != null)  return true

  const ret = await this('get_group_member_list', {
    'group_id': group_id,
  })
  const members = {}
  for (const member of ret.data) {
    members[member['user_id']] = member
  }
  cache.set(`GroupMember:${group_id}`, members)
}
async function getGroupMember(group_id, user_id) {
  await this._refreshGroupMember(group_id)
  const members = cache.get(`GroupMember:${group_id}`)
  return _.get(members, user_id)
}
async function getGroupMemberName(group_id, user_id) {
  const user = await this.getGroupMember(group_id, user_id) || {}
  return user.card || user.nickname || user.user_id
}
async function isGroupAdmin(group_id, user_id) {
  const user = await this.getGroupMember(group_id, user_id) || {}
  const role = _.get(user, 'role')
  return ['owner', 'admin'].includes(role)
}

async function _refreshAPIGetGroupMembers(group_id) {
  if (group_id == null)  return false
  if (cache.getTtl(`API:get_group_members:${group_id}`) != null)  return true

  const credresp = await this('get_credentials')
  const { cookies, csrf_token } = credresp.data
  const rawdata = await request.post({
    url: 'https://qinfo.clt.qq.com/cgi-bin/qun_info/get_group_members',
    headers: {
      'Referer': 'https://qinfo.clt.qq.com/',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 QQ/7.9.9.445 V1_IPH_SQ_7.9.9_1_APP_A Pixel/1125 Core/UIWebView Device/Apple(iPhone XS) NetType/WIFI QBWebViewType/1',
      'Cookie': cookies,
    },
    form: {
      gc : group_id,
      bkn: csrf_token,
    },
  })
  const data = JSON.parse(rawdata)
  cache.set(`API:get_group_members:${group_id}`, data)
}
async function _refreshGroupLevelName(group_id) {
  if (group_id == null)  return false
  if (cache.getTtl(`GroupLevelName:${group_id}`) != null)  return true

  await this._refreshAPIGetGroupMembers(group_id)
  const { levelname } = cache.get(`API:get_group_members:${group_id}`)
  const gln = {}
  for (let [ level, name ] of Object.entries(levelname)) {
    gln[name] = level.replace('lvln', '')
  }
  cache.set(`GroupLevelName:${group_id}`, gln)
}
async function _refreshGroupMemberLevel(group_id) {
  if (group_id == null)  return false
  if (cache.getTtl(`GroupMemberLevel:${group_id}`) != null)  return true

  await this._refreshAPIGetGroupMembers(group_id)
  const { lv: userlvs } = cache.get(`API:get_group_members:${group_id}`)
  const ulvs = {}
  for (const [ uid, info ] of Object.entries(userlvs)) {
    ulvs[uid] = info.l
  }
  cache.set(`GroupMemberLevel:${group_id}`, ulvs)
}

async function getGroupMemberLevel(group_id, user_id) {
  await this._refreshGroupMemberLevel(group_id)
  const ulvs = cache.get(`GroupMemberLevel:${group_id}`)
  return ulvs[user_id]
}
async function getGroupMemberLevelAll(group_id) {
  await this._refreshGroupMemberLevel(group_id)
  const ulvs = cache.get(`GroupMemberLevel:${group_id}`)
  return ulvs
}

async function getGroupBannedUsers(group_id) {
  const credresp = await this('get_credentials')
  const { cookies, csrf_token } = credresp.data
  const rawdata = await request.post({
    url: 'https://qinfo.clt.qq.com/cgi-bin/qun_info/get_group_shutup',
    headers: {
      'Referer': 'https://qinfo.clt.qq.com/',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 QQ/7.9.9.445 V1_IPH_SQ_7.9.9_1_APP_A Pixel/1125 Core/UIWebView Device/Apple(iPhone XS) NetType/WIFI QBWebViewType/1',
      'Cookie': cookies,
    },
    form: {
      gc : group_id,
      bkn: csrf_token,
    },
  })
  const { shutup_list } = JSON.parse(rawdata)
  const users = {}
  for (const { t, uin } of shutup_list) {
    users[uin] = t
  }
  return users
}


export function injectCQWS(CQWebSocket) {
  Object.assign(CQWebSocket.prototype, {
    _refreshGroupMember,
    getGroupMember,
    getGroupMemberName,
    isGroupAdmin,
    _refreshAPIGetGroupMembers,
    _refreshGroupLevelName,
    _refreshGroupMemberLevel,
    getGroupMemberLevel,
    getGroupMemberLevelAll,
    getGroupBannedUsers,
  })
  return CQWebSocket
}