// src/controllers/spotify.controller.js
const supabase = require('../db/supabaseClient');
const { getRecommendationsForUser } = require('../services/spotify');

exports.recommendations = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'unauthorized' });

    // getRecommendationsForUser maneja refresh y fallback
    const recs = await getRecommendationsForUser(user);

    // devolver en el mismo formato que el search
    return res.json(recs);
  } catch (err) {
    console.error('spotify.recommendations error', err.response?.data || err.message || err);
    return res.status(500).json({ error: 'spotify_failed' });
  }
};
