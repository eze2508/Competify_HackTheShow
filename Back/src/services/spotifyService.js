// src/services/spotifyService.js
const axios = require('axios');
const qs = require('qs');
const supabase = require('../db/supabaseClient');

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

function basicAuthHeader() {
  const token = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  return `Basic ${token}`;
}

async function refreshAccessTokenForUser(user) {
  if (!user?.refresh_token) return null;
  try {
    const data = qs.stringify({
      grant_type: 'refresh_token',
      refresh_token: user.refresh_token
    });
    const res = await axios.post(TOKEN_URL, data, {
      headers: {
        Authorization: basicAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, expires_in, refresh_token } = res.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    const update = { access_token, token_expires_at: expiresAt };
    if (refresh_token) update.refresh_token = refresh_token;

    const { error } = await supabase.from('users').update(update).eq('id', user.id);
    if (error) console.error('Error updating tokens in supabase', error);
    return { access_token, expires_in, refresh_token };
  } catch (err) {
    console.error('Failed to refresh token for user', user.spotify_id, err.response?.data || err.message);
    return null;
  }
}

async function getCurrentlyPlaying(access_token) {
  try {
    const res = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${access_token}` },
      validateStatus: status => status < 500
    });
    
    console.log('🔍 [Spotify] getCurrentlyPlaying status:', res.status);
    
    if (res.status === 429) {
      console.warn('⚠️ [Spotify] Rate limit (429) - Demasiadas peticiones, saltando este tick');
      return null;
    }
    
    if (res.status === 204) {
      console.log('⚪ [Spotify] Status 204 - No hay reproducción activa');
      return null;
    }
    
    if (res.status === 200 && res.data) {
      console.log('🎵 [Spotify] Reproduciendo:', res.data.item?.name || 'unknown');
      console.log('🎵 [Spotify] is_playing:', res.data.is_playing);
      return res.data;
    }
    
    console.log('⚠️ [Spotify] Status inesperado:', res.status, 'Data:', res.data);
    return null;
  } catch (err) {
    console.error('🔴 [Spotify] Error en getCurrentlyPlaying:', err.response?.status, err.response?.data || err.message);
    return null; // No lanzar error, solo registrar y devolver null
  }
}

async function searchTracks(access_token, q) {
  try {
    const res = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${access_token}` },
      params: { q, type: 'track', limit: 20 }
    });
    const tracks = (res.data?.tracks?.items || []).map(t => ({
      track_id: t.id,
      name: t.name,
      artist: (t.artists || []).map(a => a.name).join(', '),
      album: t.album?.name || null,
      album_image_url: t.album?.images?.[0]?.url || null
    }));
    return tracks;
  } catch (err) {
    console.error('Spotify search error', err.response?.data || err.message);
    throw err;
  }
}

module.exports = {
  refreshAccessTokenForUser,
  getCurrentlyPlaying,
  searchTracks
};
