// Inject utilities to CQWebSocket

import _ from 'lodash'

const GroupMemberCache   = {}
const GroupMemberCacheLU = {}
const GroupMemberCacheExpires = 24 * 60 * 60 * 1000
async function _refreshGroupMember(group_id) {
  if (group_id == null)
    return false
  if ((GroupMemberCacheLU[group_id] || 0) + GroupMemberCacheExpires >= Date.now())
    return true
  const ret = await this('get_group_member_list', {
    'group_id': group_id,
  })
  const members = {}
  for (const member of ret.data) {
    members[member['user_id']] = member
  }
  GroupMemberCacheLU[group_id] = Date.now()
  GroupMemberCache[group_id] = members
}
async function isGroupAdmin(group_id, user_id) {
  await this._refreshGroupMember(group_id)
  const role = _.get(GroupMemberCache, [group_id, user_id, 'role'])
  return ['owner', 'admin'].includes(role)
}
async function getGroupMemberName(group_id, user_id) {
  await this._refreshGroupMember(group_id)
  const user = _.get(GroupMemberCache, [group_id, user_id], {})
  return user.card || user.nickname || user.user_id
}

export function injectCQWS(CQWebSocket) {
  CQWebSocket.prototype._refreshGroupMember = _refreshGroupMember
  CQWebSocket.prototype.isGroupAdmin        = isGroupAdmin
  CQWebSocket.prototype.getGroupMemberName  = getGroupMemberName
  return CQWebSocket
}