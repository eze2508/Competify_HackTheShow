// src/controllers/clubs.controller.js
const clubsSvc = require('../services/clubs');

exports.createClub = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'club_name_required' });

    const result = await clubsSvc.createClubService({ userId, name: name.trim() });
    if (result.error) {
      const code = result.error.code;
      if (code === 'already_in_club') return res.status(400).json({ error: 'already_in_club' });
      if (code === 'club_name_taken') return res.status(400).json({ error: 'club_name_taken' });
      return res.status(500).json({ error: 'server_error' });
    }

    return res.json(result.data);
  } catch (err) {
    console.error('createClub controller error', err);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.joinClub = async (req, res) => {
  try {
    const userId = req.user.id;
    const { clubId, club_id } = req.body;
    const targetClubId = clubId || club_id;
    if (!targetClubId) return res.status(400).json({ error: 'clubId_required' });

    const result = await clubsSvc.joinClubService({ userId, clubId: targetClubId });
    if (result.error) {
      const code = result.error.code;
      if (code === 'already_in_club') return res.status(400).json({ error: 'already_in_club' });
      if (code === 'club_not_found') return res.status(404).json({ error: 'club_not_found' });
      return res.status(500).json({ error: 'server_error' });
    }

    return res.json(result.data);
  } catch (err) {
    console.error('joinClub controller error', err);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.leaveClub = async (req, res) => {
  try {
    const userId = req.user.id;
    const { clubId, club_id } = req.body;
    const targetClubId = clubId || club_id;
    
    // If no clubId provided, determine user's current club
    let finalClubId = targetClubId;
    if (!finalClubId) {
      const { data: member } = await require('../db/supabase').getMemberByUserId(userId);
      if (!member) return res.status(400).json({ error: 'not_in_club' });
      finalClubId = member.club_id;
    }
    
    const result = await clubsSvc.leaveClubService({ userId, clubId: finalClubId });
    if (result.error) {
      const code = result.error.code;
      if (code === 'not_in_club') return res.status(400).json({ error: 'not_in_club' });
      return res.status(500).json({ error: 'server_error' });
    }

    return res.json(result.data);
  } catch (err) {
    console.error('leaveClub controller error', err);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.searchClubs = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || name.trim() === '') return res.status(400).json({ error: 'name_required' });

    const result = await clubsSvc.searchClubsService({ name: name.trim(), limit: 20 });
    if (result.error) return res.status(500).json({ error: 'server_error' });
    return res.json(result.data);
  } catch (err) {
    console.error('searchClubs controller error', err);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.listClubs = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔵 [Clubs] listClubs - userId:', userId);
    
    // Obtener el club del usuario
    const result = await clubsSvc.getUserClubService({ userId });
    if (result.error) {
      console.log('⚪ [Clubs] Usuario no está en ningún club');
      return res.json({ clubs: [] });
    }
    
    console.log('🟢 [Clubs] Club del usuario:', result.data);
    return res.json({ clubs: result.data ? [result.data] : [] });
  } catch (err) {
    console.error('🔴 [Clubs] listClubs controller error', err);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.listAllClubs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await clubsSvc.listClubsService({ page, limit });
    if (result.error) return res.status(500).json({ error: 'server_error' });
    return res.json(result.data);
  } catch (err) {
    console.error('listAllClubs controller error', err);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.debugUserClub = async (req, res) => {
  try {
    const userId = req.user.id;
    const db = require('../db/supabase');
    
    console.log('🔍 [Debug] Verificando club del usuario:', userId);
    
    // Verificar membresía
    const { data: member, error: memberErr } = await db.getMemberByUserId(userId);
    console.log('🔍 [Debug] Membresía encontrada:', { member, memberErr });
    
    if (!member) {
      return res.json({ 
        inClub: false, 
        message: 'Usuario no está en ningún club',
        member: null,
        club: null
      });
    }
    
    // Verificar si el club existe
    const { data: club, error: clubErr } = await db.getClubById(member.club_id);
    console.log('🔍 [Debug] Club encontrado:', { club, clubErr });
    
    return res.json({
      inClub: true,
      member: member,
      club: club,
      isOrphan: !club
    });
  } catch (err) {
    console.error('🔴 [Debug] Error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.cleanOrphanMembership = async (req, res) => {
  try {
    const userId = req.user.id;
    const supabase = require('../db/supabaseClient');
    
    console.log('🔧 [Clean] Limpiando membresías huérfanas para:', userId);
    
    // Eliminar cualquier membresía del usuario
    const { error } = await supabase
      .from('club_members')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('🔴 [Clean] Error:', error);
      return res.status(500).json({ error: 'server_error' });
    }
    
    console.log('🟢 [Clean] Membresías limpiadas');
    return res.json({ message: 'Membresías limpiadas', success: true });
  } catch (err) {
    console.error('🔴 [Clean] Error:', err);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.getMembers = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const result = await clubsSvc.membersOfClubService({ clubId });
    if (result.error) return res.status(500).json({ error: 'server_error' });
    return res.json(result.data);
  } catch (err) {
    console.error('getMembers controller error', err);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before || null;

    const result = await clubsSvc.getMessagesService({ clubId, limit, before });
    if (result.error) return res.status(500).json({ error: 'server_error' });
    return res.json(result.data);
  } catch (err) {
    console.error('getMessages controller error', err);
    return res.status(500).json({ error: 'server_error' });
  }
};

exports.postMessage = async (req, res) => {
  try {
    const clubId = req.params.clubId;
    const userId = req.user.id;
    const { message } = req.body;

    const result = await clubsSvc.postMessageService({ clubId, userId, message });
    if (result.error) {
      const code = result.error.code;
      if (code === 'message_empty') return res.status(400).json({ error: 'message_empty' });
      if (code === 'not_in_club') return res.status(403).json({ error: 'not_in_club' });
      return res.status(500).json({ error: 'server_error' });
    }

    return res.json(result.data);
  } catch (err) {
    console.error('postMessage controller error', err);
    return res.status(500).json({ error: 'server_error' });
  }
};
