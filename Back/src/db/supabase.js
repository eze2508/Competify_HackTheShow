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
  const { data, error } = await supabase
    .from('club_members')
    .select('club_id, count:user_id', { count: 'exact' })
    .in('club_id', clubIds);

  // supabase won't return count per group like that; better query grouped
  // implement grouped count:
  const { data: grouped, error: gErr } = await supabase
    .from('club_members')
    .select('club_id, count:user_id', { count: 'exact' })
    .in('club_id', clubIds)
    .group('club_id');

  // fallback: do simple counts per club
  if (gErr || !grouped) {
    const counts = {};
    for (const id of clubIds) {
      const { count } = await supabase.from('club_members').select('*', { count: 'exact' }).eq('club_id', id);
      counts[id] = count || 0;
    }
    return counts;
  }

  const map = {};
  (grouped || []).forEach(r => {
    map[r.club_id] = Number(r.count) || 0;
  });
  return map;
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
  getClubMemberCountMap
};
