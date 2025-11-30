// src/middleware/requireClubMember.js
const db = require('../db/supabase');

module.exports = async function requireClubMember(req, res, next) {
  try {
    console.log('🔵 [Middleware] requireClubMember - checking membership');
    const user = req.user;
    const clubId = req.params.clubId || req.body.clubId || req.query.clubId;
    
    console.log('🔵 [Middleware] user.id:', user?.id, 'clubId:', clubId);
    
    if (!user) {
      console.log('🔴 [Middleware] No user found');
      return res.status(401).json({ error: 'unauthorized' });
    }
    if (!clubId) {
      console.log('🔴 [Middleware] No clubId found');
      return res.status(400).json({ error: 'clubId_required' });
    }

    // check membership
    const membersResult = await db.getMembersByClubId(clubId);
    if (membersResult.error) {
      console.error('🔴 [Middleware] requireClubMember DB error', membersResult.error);
      return res.status(500).json({ error: 'server_error' });
    }
    const members = membersResult.data || [];
    console.log('🔵 [Middleware] Found', members.length, 'members in club');
    
    const isMember = members.some(m => m.user_id === user.id);
    console.log('🔵 [Middleware] User is member:', isMember);
    
    if (!isMember) {
      console.log('🔴 [Middleware] User not in club');
      return res.status(403).json({ error: 'not_in_club' });
    }

    // attach club info optionally
    req.clubId = clubId;
    console.log('🟢 [Middleware] Membership verified, proceeding...');
    next();
  } catch (err) {
    console.error('🔴 [Middleware] requireClubMember error', err);
    res.status(500).json({ error: 'server_error' });
  }
};
