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

async function _refreshGroupLevelName(group_id) {
  if (group_id == null)  return false
  if (cache.getTtl(`GroupLevelName:${group_id}`) != null)  return true

  const credresp = await this('get_credentials')
  const { cookies, csrf_token } = credresp.data
  const rawdata = await request.post({
    url: 'https://qinfo.clt.qq.com/cgi-bin/qun_info/get_group_level_info',
    headers: {
      'Referer': 'https://qinfo.clt.qq.com/qlevel/setting.html',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 QQ/7.9.9.445 V1_IPH_SQ_7.9.9_1_APP_A Pixel/1125 Core/UIWebView Device/Apple(iPhone XS) NetType/WIFI QBWebViewType/1',
      'Cookie': cookies,
    },
    form: {
      gc : 208372001,
      bkn: csrf_token,
    },
  })
  const leveldata = JSON.parse(rawdata)
  const nlmap = {}
  for (let [ level, name ] of Object.entries(leveldata.levelname)) {
    nlmap[name] = level.replace('lvln', '')
  }
  cache.set(`GroupLevelName:${group_id}`, nlmap)
}

async function getGroupMemberLevel(group_id, user_id) {
  await this._refreshGroupLevelName(group_id)
  const user = await this.getGroupMember(group_id, user_id) || {}
  const nlmap = cache.get(`GroupLevelName:${group_id}`)
  return nlmap[user['level']] || -1
}


export function injectCQWS(CQWebSocket) {
  Object.assign(CQWebSocket.prototype, {
    _refreshGroupMember,
    getGroupMember,
    getGroupMemberName,
    isGroupAdmin,
    _refreshGroupLevelName,
    getGroupMemberLevel,
  })
  return CQWebSocket
}