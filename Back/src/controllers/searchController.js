// src/controllers/searchController.js
const supabase = require('../db/supabaseClient');
const { refreshAccessTokenForUser, searchTracks } = require('../services/spotifyService');

exports.search = async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: 'q query param required' });

    const user = req.user;

    // ensure token fresh
    if (!user.access_token || new Date(user.token_expires_at) <= new Date()) {
      await refreshAccessTokenForUser(user);
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
      user.access_token = data.access_token;
      user.token_expires_at = data.token_expires_at;
    }

    const tracks = await searchTracks(user.access_token, q);
    res.json(tracks);
  } catch (err) {
    console.error('Search controller error', err.response?.data || err.message || err);
    res.status(500).json({ error: 'Search failed' });
  }
};
