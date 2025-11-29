// src/controllers/searchController.js
const supabase = require('../db/supabaseClient');
const axios = require('axios');
const { refreshAccessTokenForUser, searchTracks } = require('../services/spotifyService');

/**
 * Asegura que el usuario tenga un token válido
 */
async function ensureValidToken(user) {
  if (!user.access_token || new Date(user.token_expires_at) <= new Date()) {
    await refreshAccessTokenForUser(user);
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    return data.access_token;
  }
  return user.access_token;
}

exports.search = async (req, res) => {
  try {
    const q = req.query.q;
    // If q is missing or empty -> return query_empty true
    if (typeof q === 'undefined' || q === null || ('' + q).trim() === '') {
      return res.status(400).json({ query_empty: true });
    }

    const user = req.user;
    const accessToken = await ensureValidToken(user);

    const tracks = await searchTracks(accessToken, q);
    res.json(tracks);
  } catch (err) {
    console.error('Search controller error', err.response?.data || err.message || err);
    return res.status(500).json({ error: 'spotify_failed' });
  }
};

/**
 * POST /search/artists - Buscar artistas en Spotify
 */
exports.searchArtists = async (req, res) => {
  try {
    const q = req.query.q || req.body.query;
    
    if (!q || q.trim() === '') {
      return res.json([]);
    }

    const user = req.user;
    const accessToken = await ensureValidToken(user);

    // Buscar en Spotify API
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        q: q.trim(),
        type: 'artist',
        limit: 20
      }
    });

    const artists = (response.data.artists?.items || []).map(artist => ({
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images[0]?.url || null,
      genres: artist.genres || [],
      followers: artist.followers?.total || 0,
      popularity: artist.popularity || 0
    }));

    res.json(artists);
  } catch (err) {
    console.error('searchArtists error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to search artists', details: err.message });
  }
};