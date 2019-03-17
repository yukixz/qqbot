// Inject utilities to CQWebSocket

import _ from 'lodash'

const GroupMemberCache   = {}
const GroupMemberCacheLU = {}
const GroupMemberCacheExpires = 24 * 60 * 60 * 1000
async function isGroupAdmin(group_id, user_id) {
  if (group_id == null || user_id == null)
    return false
  // Refresh group member when no data or expired
  if (GroupMemberCache[group_id] == null || 
      GroupMemberCacheLU[group_id] <= (Date.now() - GroupMemberCacheExpires)) {
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
  // Consider owner/admin as admin
  const role = _.get(GroupMemberCache, [group_id, user_id, 'role'])
  return ['owner', 'admin'].includes(role)
}

export function injectCQWS(CQWebSocket) {
  CQWebSocket.prototype.isGroupAdmin = isGroupAdmin
  return CQWebSocket
}