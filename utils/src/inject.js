// Inject utilities to CQWebSocket

const GroupMemberCache   = {}
const GroupMemberCacheLU = {}
const GroupMemberCacheExpires = 24 * 60 * 60 * 1000
async function isGroupAdmin(group, user) {
  if (group == null || user == null)
    return false
  // Refresh group member when no data or expired
  if (GroupMemberCache[group] == null || 
      GroupMemberCacheLU[group] <= (Date.now() - GroupMemberCacheExpires)) {
    const ret = await this('get_group_member_list', {
      'group_id': group,
    })
    const members = {}
    for (const member of ret.data) {
      members[member['user_id']] = member
    }
    GroupMemberCacheLU[group] = Date.now()
    GroupMemberCache[group] = members
  }
  // Consider owner/admin as admin
  return ['owner', 'admin'].includes(GroupMemberCache[group][user]['role'])
}

export function injectCQWS(CQWebSocket) {
  CQWebSocket.prototype.isGroupAdmin = isGroupAdmin
  return CQWebSocket
}