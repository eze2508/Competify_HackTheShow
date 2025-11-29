// src/db/supabase.js
const supabase = require('./supabaseClient');

/**
 * Clubs DB helpers
 */

async function createClub({ name, owner_id }) {
  return supabase.from('clubs').insert({
    name,
    owner_id
  }).select().single();
}

async function getClubById(id) {
  return supabase.from('clubs').select('*').eq('id', id).single();
}

async function getClubByName(name) {
  return supabase.from('clubs').select('*').ilike('name', name).limit(1).single();
}

async function addMember({ club_id, user_id }) {
  return supabase.from('club_members').insert({
    club_id,
    user_id
  }).select().single();
}

async function removeMember({ club_id, user_id }) {
  return supabase.from('club_members').delete().match({ club_id, user_id });
}

async function getMemberByUserId(user_id) {
  return supabase.from('club_members').select('*').eq('user_id', user_id).single();
}

async function getMembersByClubId(club_id) {
  return supabase.from('club_members').select('id, user_id, joined_at').eq('club_id', club_id);
}

async function countMembers(club_id) {
  return supabase.rpc('count_club_members', { cid: club_id }).then(r => r); // optional RPC if exists
}

async function searchClubsByName(name, limit = 20) {
  // case-insensitive search using ilike
  return supabase.from('clubs')
    .select('id, name')
    .ilike('name', `%${name}%`)
    .limit(limit);
}

async function listClubs({ page = 1, limit = 10 }) {
  const offset = (page - 1) * limit;
  return supabase.from('clubs')
    .select('id, name')
    .range(offset, offset + limit - 1);
}

async function getClubMemberCountMap(clubIds = []) {
  if (!clubIds || clubIds.length === 0) return {};
  
  // Obtener todos los miembros de los clubs especificados
  const { data, error } = await supabase
    .from('club_members')
    .select('club_id')
    .in('club_id', clubIds);

  if (error || !data) {
    console.error('Error getting club members:', error);
    return {};
  }

  // Contar manualmente agrupando por club_id
  const counts = {};
  clubIds.forEach(id => counts[id] = 0);
  
  data.forEach(member => {
    if (counts[member.club_id] !== undefined) {
      counts[member.club_id]++;
    } else {
      counts[member.club_id] = 1;
    }
  });

  return counts;
}

async function getClubMessages(club_id, limit = 50, before) {
  let query = supabase.from('club_messages')
    .select('id, user_id, message, created_at')
    .eq('club_id', club_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('created_at', before);
  }
  return query;
}

async function insertClubMessage({ club_id, user_id, message }) {
  return supabase.from('club_messages').insert({
    club_id, user_id, message
  }).select().single();
}

async function deleteClubIfEmpty(club_id) {
  // check members
  const { count } = await supabase.from('club_members').select('*', { count: 'exact' }).eq('club_id', club_id);
  if (!count || count === 0) {
    return supabase.from('clubs').delete().eq('id', club_id);
  }
  return { data: null, error: null };
}

async function getTotalMsPerUserForClub(club_id) {
  // returns mapping user_id -> sum(total_ms)
  const { data, error } = await supabase
    .from('listening_sessions')
    .select('user_id, total_ms')
    .in('user_id', (await getMembersByClubId(club_id)).data.map(m => m.user_id));

  if (error) return { error };

  const map = {};
  (data || []).forEach(r => {
    map[r.user_id] = (map[r.user_id] || 0) + (r.total_ms || 0);
  });
  return { data: map };
}

async function isMember({ club_id, user_id }) {
  const { data } = await getMembersByClubId(club_id);
  return data?.some(m => m.user_id === user_id);
}

/**
 * Friends DB helpers
 */

async function getUserById(userId) {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  return error ? null : data;
}

async function areFriends(userId1, userId2) {
  const { data, error } = await supabase.from('friends')
    .select('*')
    .eq('user_id', userId1)
    .eq('friend_id', userId2)
    .limit(1)
    .single();
  return data ? true : false;
}

async function findPendingFriendRequest(fromUser, toUser) {
  const { data, error } = await supabase.from('friend_requests')
    .select('*')
    .eq('from_user', fromUser)
    .eq('to_user', toUser)
    .eq('status', 'pending')
    .single();
  return error ? null : data;
}

async function createFriendRequest(fromUser, toUser) {
  return supabase.from('friend_requests').insert({
    from_user: fromUser,
    to_user: toUser,
    status: 'pending'
  }).select().single();
}

async function getFriendRequest(requestId) {
  const { data, error } = await supabase.from('friend_requests')
    .select('*')
    .eq('id', requestId)
    .single();
  return error ? null : data;
}

async function acceptFriendRequest(requestId) {
  const result = await supabase.from('friend_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId);
  
  if (result.error) {
    console.error('Error accepting friend request:', result.error);
    throw result.error;
  }
  
  return result;
}

async function rejectFriendRequest(requestId) {
  const result = await supabase.from('friend_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId);
  
  if (result.error) {
    console.error('Error rejecting friend request:', result.error);
    throw result.error;
  }
  
  return result;
}

async function deleteFriendRequest(requestId) {
  const result = await supabase.from('friend_requests').delete().eq('id', requestId);
  
  if (result.error) {
    console.error('Error deleting friend request:', result.error);
    throw result.error;
  }
  
  return result;
}

async function insertFriendsRelation(userId1, userId2) {
  // Insert both directions of the friendship
  const result1 = await supabase.from('friends').insert({
    user_id: userId1,
    friend_id: userId2
  }).select().single();
  
  if (result1.error) {
    console.error('Error inserting friends relation (direction 1):', result1.error);
    throw result1.error;
  }
  
  const result2 = await supabase.from('friends').insert({
    user_id: userId2,
    friend_id: userId1
  }).select().single();
  
  if (result2.error) {
    console.error('Error inserting friends relation (direction 2):', result2.error);
    throw result2.error;
  }
  
  return result1;
}

async function listFriends(userId) {
  const { data, error } = await supabase.from('friends')
    .select('friend_id')
    .eq('user_id', userId);
  
  if (error) return [];
  
  // Extract friend IDs
  const friendIds = data.map(row => row.friend_id);
  
  if (friendIds.length === 0) return [];
  
  // Get user details for all friends (including access_token for Spotify API calls)
  const { data: users, error: usersError } = await supabase.from('users')
    .select('id, spotify_id, access_token')
    .in('id', friendIds);
  
  return usersError ? [] : users;
}

async function listReceivedFriendRequests(userId) {
  const { data, error } = await supabase.from('friend_requests')
    .select('id, from_user, created_at')
    .eq('to_user', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  
  if (error || !data || data.length === 0) return [];
  
  // Get user info for all from_users
  const fromUserIds = data.map(req => req.from_user);
  const { data: users, error: usersError } = await supabase.from('users')
    .select('id, spotify_id')
    .in('id', fromUserIds);
  
  if (usersError) return data;
  
  // Map user info to requests
  const userMap = {};
  (users || []).forEach(u => {
    userMap[u.id] = u;
  });
  
  return data.map(req => ({
    id: req.id,
    from_user_id: req.from_user,
    from_user_spotify_id: userMap[req.from_user]?.spotify_id || req.from_user,
    created_at: req.created_at
  }));
}

async function listSentFriendRequests(userId) {
  const { data, error } = await supabase.from('friend_requests')
    .select('id, to_user, created_at')
    .eq('from_user', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  
  if (error || !data || data.length === 0) return [];
  
  // Get user info for all to_users
  const toUserIds = data.map(req => req.to_user);
  const { data: users, error: usersError } = await supabase.from('users')
    .select('id, spotify_id')
    .in('id', toUserIds);
  
  if (usersError) return data;
  
  // Map user info to requests
  const userMap = {};
  (users || []).forEach(u => {
    userMap[u.id] = u;
  });
  
  return data.map(req => ({
    id: req.id,
    to_user_id: req.to_user,
    to_user_spotify_id: userMap[req.to_user]?.spotify_id || req.to_user,
    created_at: req.created_at
  }));
}

async function removeFriendsRelation(userId1, userId2) {
  // Remove both directions of the friendship
  await supabase.from('friends')
    .delete()
    .eq('user_id', userId1)
    .eq('friend_id', userId2);
  
  await supabase.from('friends')
    .delete()
    .eq('user_id', userId2)
    .eq('friend_id', userId1);
  
  return { success: true };
}


module.exports = {
  createClub,
  getClubById,
  getClubByName,
  addMember,
  removeMember,
  getMemberByUserId,
  getMembersByClubId,
  searchClubsByName,
  listClubs,
  getClubMessages,
  insertClubMessage,
  deleteClubIfEmpty,
  getTotalMsPerUserForClub,
  getClubMemberCountMap,
  isMember,

  // Friends functions
  getUserById,
  areFriends,
  findPendingFriendRequest,
  createFriendRequest,
  getFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  deleteFriendRequest,
  insertFriendsRelation,
  listFriends,
  listReceivedFriendRequests,
  listSentFriendRequests,
  removeFriendsRelation,

  // 🔥 ALIAS necesarios para que los tests no exploten
  getClubByUserId: getMemberByUserId,
  getClubByNameLike: searchClubsByName
};