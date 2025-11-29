// src/services/clubs.js
const db = require('../db/supabase');
const supabase = require('../db/supabaseClient');

async function createClubService({ userId, name }) {
  console.log('🔵 [Clubs] createClubService - userId:', userId, 'name:', name);
  
  // 1. check user not in a club
  const { data: existingMember, error: memberCheckErr } = await db.getMemberByUserId(userId);
  console.log('🔍 [Clubs] Verificando membresía existente:', { existingMember, memberCheckErr });
  
  if (existingMember) {
    console.log('🔴 [Clubs] Usuario ya está en club:', existingMember.club_id);
    return { error: { code: 'already_in_club', clubId: existingMember.club_id } };
  }

  // 2. check unique name
  const { data: existingClub, error: clubErr } = await db.getClubByName(name);
  console.log('🔍 [Clubs] Verificando nombre único:', { existingClub, clubErr });
  
  if (existingClub) {
    console.log('🔴 [Clubs] Nombre de club ya existe');
    return { error: { code: 'club_name_taken' } };
  }

  // 3. create club
  console.log('🔵 [Clubs] Creando club...');
  const { data: clubData, error: createErr } = await db.createClub({ name, owner_id: userId });
  if (createErr) {
    console.error('🔴 [Clubs] createClubService createErr', createErr);
    return { error: { code: 'server_error' } };
  }
  console.log('🟢 [Clubs] Club creado:', clubData);

  // 4. add owner as member
  console.log('🔵 [Clubs] Agregando owner como miembro...');
  const { data: memberData, error: memberErr } = await db.addMember({ club_id: clubData.id, user_id: userId });
  if (memberErr) {
    console.error('🔴 [Clubs] createClubService addMember error', memberErr);
    // try to rollback club
    await supabase.from('clubs').delete().eq('id', clubData.id);
    return { error: { code: 'server_error' } };
  }
  console.log('🟢 [Clubs] Miembro agregado:', memberData);

  return { data: { ...clubData, member: memberData } };
}

async function joinClubService({ userId, clubId }) {
  // check user not in club
  const { data: existingMember } = await db.getMemberByUserId(userId);
  if (existingMember) return { error: { code: 'already_in_club' } };

  // verify club exists
  const { data: club, error: clubErr } = await db.getClubById(clubId);
  if (clubErr || !club) return { error: { code: 'club_not_found' } };

  // add member
  const { data: member, error: memberErr } = await db.addMember({ club_id: clubId, user_id: userId });
  if (memberErr) {
    // if unique constraint hits, treat as already_in_club
    if (memberErr.code === '23505') return { error: { code: 'already_in_club' } };
    console.error('joinClubService error', memberErr);
    return { error: { code: 'server_error' } };
  }

  return { data: club };
}

async function leaveClubService({ userId, clubId }) {
  // verify membership
  const { data: member } = await db.getMemberByUserId(userId);
  if (!member || member.club_id !== clubId) {
    return { error: { code: 'not_in_club' } };
  }

  // remove member
  const { error } = await db.removeMember({ club_id: clubId, user_id: userId });
  if (error) {
    console.error('leaveClubService removeMember error', error);
    return { error: { code: 'server_error' } };
  }

  // if club empty -> delete
  const { data: membersLeft, error: leftErr } = await db.getMembersByClubId(clubId);
  if (leftErr) {
    console.error('leaveClubService getMembersByClubId error', leftErr);
    return { error: { code: 'server_error' } };
  }
  if (!membersLeft || membersLeft.length === 0) {
    const { error: delErr } = await db.deleteClubIfEmpty(clubId);
    if (delErr) console.error('leaveClubService deleteClubIfEmpty error', delErr);
  }

  return { data: { left: true } };
}

async function searchClubsService({ name, limit = 20 }) {
  const { data, error } = await db.searchClubsByName(name, limit);
  if (error) return { error };
  const clubs = data || [];

  // count members for each club
  const clubIds = clubs.map(c => c.id);
  const counts = await db.getClubMemberCountMap(clubIds);

  const result = (clubs || []).map(c => ({
    id: c.id,
    name: c.name,
    cantidad_de_miembros: counts[c.id] || 0
  }));
  return { data: result };
}

async function getUserClubService({ userId }) {
  // Obtener la membresía del usuario
  const { data: member } = await db.getMemberByUserId(userId);
  if (!member) {
    return { error: { code: 'not_in_club' } };
  }

  // Obtener el club
  const { data: club, error } = await db.getClubById(member.club_id);
  if (error || !club) {
    return { error: { code: 'club_not_found' } };
  }

  // Obtener cantidad de miembros
  const counts = await db.getClubMemberCountMap([club.id]);

  return {
    data: {
      id: club.id,
      name: club.name,
      owner_id: club.owner_id,
      member_count: counts[club.id] || 0,
      created_at: club.created_at
    }
  };
}

async function listClubsService({ page = 1, limit = 10 }) {
  const { data, error } = await db.listClubs({ page, limit });
  if (error) return { error };
  const clubs = data || [];
  const clubIds = clubs.map(c => c.id);
  const counts = await db.getClubMemberCountMap(clubIds);

  const result = clubs.map(c => ({
    id: c.id,
    name: c.name,
    member_count: counts[c.id] || 0
  }));
  return { data: result };
}

async function membersOfClubService({ clubId }) {
  // get members
  const { data: members, error } = await db.getMembersByClubId(clubId);
  if (error) return { error };

  // get user info
  const userIds = (members.data || members).map(m => m.user_id);
  // fetch users
  const { data: users, error: usersErr } = await supabase.from('users').select('id, display_name, username').in('id', userIds);
  if (usersErr) return { error: usersErr };

  // compute total listening hours per user (sum total_ms)
  // reuse db helper
  const { data: totalMap, error: mapErr } = await db.getTotalMsPerUserForClub(clubId);
  if (mapErr) return { error: mapErr };

  // build result array
  const result = users.map(u => {
    const totalMs = totalMap[u.id] || 0;
    return {
      username: u.display_name || u.username || 'Usuario',
      hours_listened: Math.round((totalMs / 1000 / 60 / 60) * 10) / 10 // one decimal
    };
  });

  // sort desc by hours_listened
  result.sort((a, b) => b.hours_listened - a.hours_listened);

  return { data: result };
}

async function getMessagesService({ clubId, limit = 50, before }) {
  const { data, error } = await db.getClubMessages(clubId, limit, before);
  if (error) return { error };

  const messages = data || [];
  // fetch usernames for user_ids
  const userIds = Array.from(new Set(messages.map(m => m.user_id)));
  const { data: users } = await supabase.from('users').select('id, display_name, username').in('id', userIds);
  const userMap = {};
  (users || []).forEach(u => userMap[u.id] = u.display_name || u.username || 'Usuario');

  const result = messages.map(m => ({
    id: m.id,
    username: userMap[m.user_id] || 'Usuario',
    message: m.message,
    created_at: m.created_at
  }));

  return { data: result };
}

async function postMessageService({ clubId, userId, message }) {
  if (!message || !(''+message).trim()) return { error: { code: 'message_empty' } };

  // verify membership
  const { data: member } = await db.getMemberByUserId(userId);
  if (!member || member.club_id !== clubId) return { error: { code: 'not_in_club' } };

  const { data, error } = await db.insertClubMessage({ club_id: clubId, user_id: userId, message });
  if (error) return { error };

  // fetch username
  const { data: user } = await supabase.from('users').select('display_name, username').eq('id', userId).single();
  return {
    data: {
      id: data.id,
      username: user ? (user.display_name || user.username) : 'Usuario',
      message: data.message,
      created_at: data.created_at
    }
  };
}

module.exports = {
  createClubService,
  joinClubService,
  leaveClubService,
  searchClubsService,
  getUserClubService,
  listClubsService,
  membersOfClubService,
  getMessagesService,
  postMessageService
};
