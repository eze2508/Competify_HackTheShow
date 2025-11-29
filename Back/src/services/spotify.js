// src/services/spotify.js
const axios = require('axios');
const supabase = require('../db/supabaseClient');
const { refreshAccessTokenForUser } = require('./spotifyService'); // reutiliza lo que ya existe

// Helper: get fresh access token for user (refresh si hace falta)
async function ensureAccessToken(user) {
  if (!user.access_token || new Date(user.token_expires_at) <= new Date()) {
    await refreshAccessTokenForUser(user);
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    user.access_token = data.access_token;
    user.token_expires_at = data.token_expires_at;
  }
  return user.access_token;
}

// GET user's saved tracks (liked songs)
async function getSavedTracks(access_token, limit = 10) {
  try {
    const res = await axios.get('https://api.spotify.com/v1/me/tracks', {
      headers: { Authorization: `Bearer ${access_token}` },
      params: { limit }
    });
    // items[].track
    return (res.data.items || []).map(it => it.track).filter(Boolean);
  } catch (err) {
    console.error('getSavedTracks error', err.response?.data || err.message);
    throw err;
  }
}

// GET artists details (genres)
async function getArtistsByIds(access_token, artistIds = []) {
  if (!artistIds.length) return [];
  try {
    const res = await axios.get('https://api.spotify.com/v1/artists', {
      headers: { Authorization: `Bearer ${access_token}` },
      params: { ids: artistIds.join(',') }
    });
    return (res.data.artists || []);
  } catch (err) {
    console.error('getArtistsByIds error', err.response?.data || err.message);
    throw err;
  }
}

// GET recommendations based on seeds
async function getRecommendationsForUser(user) {
  try {
    const access_token = await ensureAccessToken(user);

    // 1) get saved tracks (liked)
    const saved = await getSavedTracks(access_token, 10);

    // if no liked tracks → fallback
    if (!saved || saved.length === 0) {
      // fallback: call recommendations with generic seed_genres=pop
      const fallbackRes = await axios.get('https://api.spotify.com/v1/recommendations', {
        headers: { Authorization: `Bearer ${access_token}` },
        params: {
          seed_genres: 'pop',
          limit: 20
        }
      });
      return (fallbackRes.data.tracks || []).map(mapSpotifyTrackToResponse);
    }

    // Collect seed track IDs and artist IDs
    const seedTrackIds = Array.from(new Set(saved.map(t => t.id))).slice(0, 5); // up to 5
    const artistIds = Array.from(new Set(saved.flatMap(t => (t.artists || []).map(a => a.id)))).slice(0, 5);

    // 2) get artist genres
    const artists = await getArtistsByIds(access_token, artistIds);
    const genres = (artists || []).flatMap(a => a.genres || []);
    // select up to 2 distinct genres as seeds
    const seedGenres = Array.from(new Set(genres)).slice(0, 2);

    // 3) build params for recommendations
    const params = {};
    if (seedTrackIds.length) params.seed_tracks = seedTrackIds.join(',');
    if (artistIds.length) params.seed_artists = artistIds.slice(0, 5).join(',');
    if (seedGenres.length) params.seed_genres = seedGenres.join(',');
    params.limit = 20;

    // If params empty (very unlikely) fallback to pop
    if (!params.seed_tracks && !params.seed_artists && !params.seed_genres) {
      params.seed_genres = 'pop';
    }

    // 4) call recommendations endpoint
    const recRes = await axios.get('https://api.spotify.com/v1/recommendations', {
      headers: { Authorization: `Bearer ${access_token}` },
      params
    });

    const recTracks = (recRes.data.tracks || []).map(mapSpotifyTrackToResponse);
    return recTracks;
  } catch (err) {
    console.error('getRecommendationsForUser error', err.response?.data || err.message);
    throw err;
  }
}

// helper: map a Spotify track object to the standard response
function mapSpotifyTrackToResponse(t) {
  return {
    track_id: t.id,
    name: t.name,
    artist: (t.artists || []).map(a => a.name).join(', '),
    album: t.album?.name || null,
    album_image_url: t.album?.images?.[0]?.url || null,
    preview_url: t.preview_url || null
  };
}

module.exports = {
  getRecommendationsForUser
};
