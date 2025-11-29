// src/middleware/requireClubMember.js
const db = require('../db/supabase');

module.exports = async function requireClubMember(req, res, next) {
  try {
    const user = req.user;
    const clubId = req.params.clubId || req.body.clubId || req.query.clubId;
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    if (!clubId) return res.status(400).json({ error: 'clubId_required' });

    // check membership
    const { data, error } = await db.getMembersByClubId(clubId);
    if (error) {
      console.error('requireClubMember DB error', error);
      return res.status(500).json({ error: 'server_error' });
    }
    const members = data || [];
    const isMember = members.some(m => m.user_id === user.id);
    if (!isMember) return res.status(403).json({ error: 'not_in_club' });

    // attach club info optionally
    req.clubId = clubId;
    next();
  } catch (err) {
    console.error('requireClubMember error', err);
    res.status(500).json({ error: 'server_error' });
  }
};
