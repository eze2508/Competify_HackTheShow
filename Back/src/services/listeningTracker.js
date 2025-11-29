const supabase = require('../db/supabaseClient');
const { refreshAccessTokenForUser, getCurrentlyPlaying } = require('./spotifyService');

const pollingIntervalMs = 10000; // 10 segundos para evitar rate limiting de Spotify

// In-memory map to store current track per user (to detect changes)
const activeMap = new Map(); // key: user.id, value: { trackId, startedAt, sessionId }

async function handleUser(user) {
  try {
    // refresh token if expired
    if (!user.access_token || new Date(user.token_expires_at) <= new Date()) {
      console.log(`🔵 [Tracker] Token expirado para usuario ${user.id}, refrescando...`);
      await refreshAccessTokenForUser(user);
      // reload tokens
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
      user.access_token = data.access_token;
      user.token_expires_at = data.token_expires_at;
      console.log(`🟢 [Tracker] Token refrescado para usuario ${user.id}`);
    }

    const playing = await getCurrentlyPlaying(user.access_token);
    if (!playing || !playing.item || !playing.is_playing) {
      // nothing playing -> if we had an active session, close it
      const active = activeMap.get(user.id);
      if (active && !active.ended) {
        if (playing && playing.item && !playing.is_playing) {
          console.log(`⏸️ [Tracker] Usuario ${user.id} pausó "${playing.item.name}", cerrando sesión`);
        } else {
          console.log(`⏹️ [Tracker] Usuario ${user.id} detuvo reproducción, cerrando sesión`);
        }
        await closeSession(user.id, active);
        activeMap.delete(user.id);
      }
      return;
    }
    
    console.log(`🎵 [Tracker] Usuario ${user.id} reproduciendo activamente: "${playing.item.name}"`);

    const track = playing.item;
    const trackId = track.id;
    const now = new Date();

    const active = activeMap.get(user.id);
    if (active && active.trackId === trackId) {
      // same song: nothing to do (we'll close on change). optionally update heartbeat
      return;
    }

    // song changed:
    if (active && !active.ended) {
      await closeSession(user.id, active);
    }

    // open new session
    const insert = {
      user_id: user.id,
      track_id: trackId,
      started_at: new Date().toISOString(),
      ended_at: null,
      total_ms: 0
    };
    console.log('🔵 [Tracker] Insertando nueva sesión:', { user_id: user.id, track_id: trackId, track_name: track.name });
    const { data: inserted, error } = await supabase.from('listening_sessions').insert(insert).select().single();
    if (error) {
      console.error('🔴 [Tracker] Failed to insert session', error);
      return;
    }
    console.log('🟢 [Tracker] Sesión insertada con ID:', inserted.id);
    activeMap.set(user.id, { trackId, startedAt: new Date(inserted.started_at), sessionId: inserted.id, ended: false });
  } catch (err) {
    // If token invalid, we'll try again next tick
    console.error('Error in handleUser', user.spotify_id, err.response?.data || err.message || err);
  }
}

async function closeSession(userId, active) {
  try {
    const endedAt = new Date().toISOString();
    const totalMs = Date.now() - new Date(active.startedAt).getTime();
    console.log('🔵 [Tracker] Cerrando sesión:', { userId, sessionId: active.sessionId, totalMs: Math.floor(totalMs) });
    const { error } = await supabase.from('listening_sessions').update({
      ended_at: endedAt,
      total_ms: Math.max(0, Math.floor(totalMs))
    }).eq('id', active.sessionId);
    if (error) {
      console.error('🔴 [Tracker] Error updating session', error);
    } else {
      console.log('🟢 [Tracker] Sesión cerrada exitosamente');
    }
    active.ended = true;
  } catch (err) {
    console.error('🔴 [Tracker] closeSession error', err);
  }
}

async function tick() {
  try {
    // get all users that have refresh_token (i.e., connected)
    const { data: users, error } = await supabase.from('users').select('*').not('refresh_token', 'is', null);
    if (error) {
      console.error('🔴 [Tracker] Error fetching users for tracker', error);
      return;
    }
    // Solo log cada 6 ticks (1 minuto con polling de 10s)
    if (Math.random() < 0.16) {
      console.log(`🔵 [Tracker] Rastreando ${users?.length || 0} usuarios conectados`);
    }
    await Promise.all(users.map(u => handleUser(u)));
  } catch (err) {
    console.error('🔴 [Tracker] Tick error', err);
  }
}

let intervalHandle = null;

function start() {
  if (intervalHandle) return;
  intervalHandle = setInterval(tick, pollingIntervalMs);
  console.log('ListeningTracker started, polling every', pollingIntervalMs, 'ms');
}

function stop() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

module.exports = { start, stop };
