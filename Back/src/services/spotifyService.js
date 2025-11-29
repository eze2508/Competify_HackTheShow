const axios = require('axios');
const qs = require('qs');
const supabase = require('../db/supabaseClient');

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing SPOTIFY_CLIENT_ID/SECRET in env');
  process.exit(1);
}

function basicAuthHeader() {
  const token = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  return `Basic ${token}`;
}

async function refreshAccessTokenForUser(user) {
  // user: row from users table with refresh_token
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

    // Update Supabase user
    const update = {
      access_token,
      token_expires_at: expiresAt
    };
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
      headers: {
        Authorization: `Bearer ${access_token}`
      },
      validateStatus: status => status < 500 // let 204 pass
    });

    if (res.status === 204) return null; // nothing playing
    return res.data;
  } catch (err) {
    // Possible 401 if token expired — caller should handle
    throw err;
  }
}

module.exports = {
  refreshAccessTokenForUser,
  getCurrentlyPlaying
};
