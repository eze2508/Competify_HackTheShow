// src/controllers/tracksController.js
const supabase = require('../db/supabaseClient');
const { refreshAccessTokenForUser } = require('../services/spotifyService');

exports.topListeners = async (req, res) => {
  try {
    const trackId = req.params.trackId;
    if (!trackId) return res.status(400).json({ error: 'trackId required' });

    const user = req.user;

    // Refresh token if needed (we might call Spotify for enrichment later; keep consistent)
    if (!user.access_token || new Date(user.token_expires_at) <= new Date()) {
      await refreshAccessTokenForUser(user);
    }

    // 1) Get all sessions for this track
    const { data: sessions, error } = await supabase
      .from('listening_sessions')
      .select('user_id, total_ms')
      .eq('track_id', trackId);

    if (error) {
      console.error('Error fetching sessions', error);
      return res.status(500).json({ error: 'DB error' });
    }

    // 2) Aggregate total_ms per user_id
    const agg = sessions.reduce((acc, s) => {
      const uid = s.user_id;
      acc[uid] = (acc[uid] || 0) + (s.total_ms || 0);
      return acc;
    }, {});

    // 3) Convert to array and sort
    const arr = Object.entries(agg).map(([user_id, total_ms]) => ({ user_id, total_ms }));
    arr.sort((a, b) => b.total_ms - a.total_ms);

    const top = arr.slice(0, 5);

    if (top.length === 0) return res.json([]);

    // 4) Fetch user display names for top user_ids
    const ids = top.map(t => t.user_id);
    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('id, display_name, username')
      .in('id', ids);

    if (usersErr) {
      console.error('Error fetching users', usersErr);
      return res.status(500).json({ error: 'DB error' });
    }

    const userById = {};
    (users || []).forEach(u => {
      userById[u.id] = u;
    });

    const result = top.map(t => {
      const u = userById[t.user_id];
      const name = (u && (u.display_name || u.username)) || 'Usuario';
      return { user: name, total_ms: t.total_ms };
    });

    res.json(result);
  } catch (err) {
    console.error('tracks top error', err);
    res.status(500).json({ error: 'Server error' });
  }
};
