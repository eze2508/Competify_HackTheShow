const supabase = require('../db/supabaseClient');
const axios = require('axios');
const qs = require('qs');
const jwt = require('jsonwebtoken');

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.APP_JWT_SECRET;
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

if (!JWT_SECRET) {
  console.error('Missing APP_JWT_SECRET in .env');
  process.exit(1);
}

const scopes = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-read-recently-played'
].join(' ');

exports.login = (req, res) => {
  const state = Math.random().toString(36).substring(2, 15);
  const url = 'https://accounts.spotify.com/authorize' +
    '?response_type=code' +
    `&client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&state=${encodeURIComponent(state)}`;
  res.redirect(url);
};

function basicAuthHeader() {
  const token = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  return `Basic ${token}`;
}

exports.callback = async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('No code provided');

  try {
    const data = qs.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI
    });

    const tokenRes = await axios.post(TOKEN_URL, data, {
      headers: {
        Authorization: basicAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token, expires_in } = tokenRes.data;
    // use access token to get profile
    const profileRes = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const spotify_id = profileRes.data.id;

    const token_expires_at = new Date(Date.now() + expires_in * 1000).toISOString();

    // Upsert user in Supabase
    const { data: existing, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('spotify_id', spotify_id)
      .limit(1)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // ignore no rows error handled below
    }

    if (existing) {
      await supabase.from('users').update({
        access_token,
        refresh_token,
        token_expires_at
      }).eq('id', existing.id);
      var user = { ...existing, access_token, refresh_token, token_expires_at };
    } else {
      const insert = {
        spotify_id,
        access_token,
        refresh_token,
        token_expires_at
      };
      const { data: inserted, error: insertError } = await supabase.from('users').insert(insert).select().single();
      if (insertError) {
        console.error('Error inserting user', insertError);
        return res.status(500).send('DB error');
      }
      var user = inserted;
    }

    // create JWT for frontend (contains user.id)
    const token = jwt.sign({ userId: user.id, spotify_id: spotify_id }, JWT_SECRET, { expiresIn: '30d' });

    // redirect to frontend with token (frontend should read token from query and store securely)
    const redirectUrl = `${FRONTEND_URL}?token=${encodeURIComponent(token)}`;
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('Spotify callback error', err.response?.data || err.message);
    res.status(500).send('Auth error');
  }
};
