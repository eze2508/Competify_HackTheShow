const supabase = require('../db/supabaseClient');
const { refreshAccessTokenForUser, getCurrentlyPlaying } = require('../services/spotifyService');

exports.current = async (req, res) => {
  try {
    const user = req.user;
    // refresh token if expired
    if (!user.access_token || new Date(user.token_expires_at) <= new Date()) {
      await refreshAccessTokenForUser(user);
      // reload user
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
      user.access_token = data.access_token;
      user.token_expires_at = data.token_expires_at;
    }

    const playing = await getCurrentlyPlaying(user.access_token);
    if (!playing) return res.json({ playing: null });

    const track = playing.item;
    // find active session for this user & track
    const { data: sessions } = await supabase
      .from('listening_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(1);

    let current_session = sessions && sessions[0] && sessions[0].ended_at === null ? sessions[0] : null;

    const started_at = current_session ? current_session.started_at : new Date().toISOString();
    const progress_ms = playing.progress_ms;
    const total_listened_ms = current_session
      ? (Date.now() - new Date(current_session.started_at).getTime())
      : progress_ms;

    res.json({
      track: {
        id: track.id,
        name: track.name,
        artists: track.artists.map(a => a.name)
      },
      progress_ms,
      total_listened_ms
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.profile = async (req, res) => {
  try {
    const user = req.user;
    
    // Refresh token if needed
    if (!user.access_token || new Date(user.token_expires_at) <= new Date()) {
      await refreshAccessTokenForUser(user);
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
      Object.assign(user, data);
    }

    // Get Spotify profile info
    const axios = require('axios');
    const spotifyProfile = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${user.access_token}` }
    });

    // Calculate statistics from listening_sessions
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    console.log('🔵 [Profile] Obteniendo sesiones de escucha para user_id:', user.id);

    // Total hours (all time)
    const { data: totalData, error: totalError } = await supabase
      .from('listening_sessions')
      .select('total_ms')
      .eq('user_id', user.id);
    
    if (totalError) {
      console.error('🔴 [Profile] Error obteniendo listening_sessions:', totalError);
    }
    
    console.log('🟢 [Profile] Sesiones totales encontradas:', totalData?.length || 0);
    console.log('🟢 [Profile] Primera sesión:', totalData?.[0]);
    console.log('🟢 [Profile] Última sesión:', totalData?.[totalData?.length - 1]);
    
    const totalMs = (totalData || []).reduce((sum, session) => sum + (session.total_ms || 0), 0);
    const totalHours = Math.floor(totalMs / (1000 * 60 * 60));
    
    console.log('🟢 [Profile] Total ms acumulado:', totalMs);
    console.log('🟢 [Profile] Total horas:', totalHours);

    // Current month hours
    const { data: monthData, error: monthError } = await supabase
      .from('listening_sessions')
      .select('total_ms')
      .eq('user_id', user.id)
      .gte('started_at', oneMonthAgo.toISOString());
    
    if (monthError) {
      console.error('🔴 [Profile] Error obteniendo sesiones del mes:', monthError);
    }
    
    const monthMs = (monthData || []).reduce((sum, session) => sum + (session.total_ms || 0), 0);
    const monthHours = Math.floor(monthMs / (1000 * 60 * 60));
    console.log('🟢 [Profile] Sesiones este mes:', monthData?.length, 'Total ms:', monthMs);

    // Current week hours
    const { data: weekData, error: weekError } = await supabase
      .from('listening_sessions')
      .select('total_ms')
      .eq('user_id', user.id)
      .gte('started_at', oneWeekAgo.toISOString());
    
    if (weekError) {
      console.error('🔴 [Profile] Error obteniendo sesiones de la semana:', weekError);
    }
    
    const weekMs = (weekData || []).reduce((sum, session) => sum + (session.total_ms || 0), 0);
    const weekHours = Math.floor(weekMs / (1000 * 60 * 60));
    console.log('🟢 [Profile] Sesiones esta semana:', weekData?.length, 'Total ms:', weekMs);

    // Total unique artists
    const { data: artistsData, error: artistsError } = await supabase
      .from('listening_sessions')
      .select('track_id, artist_id')
      .eq('user_id', user.id);

    if (artistsError) {
      console.error('🔴 [Profile] Error obteniendo tracks únicos:', artistsError);
    }

    // Prefer artist_id stored in listening_sessions if available
    let uniqueArtistIds = new Set();
    const rows = artistsData || [];
    if (rows.length > 0 && Object.prototype.hasOwnProperty.call(rows[0], 'artist_id')) {
      // If the sessions already store artist_id, use it directly
      rows.forEach(r => {
        if (r.artist_id) uniqueArtistIds.add(r.artist_id);
      });
    } else {
      // Fallback: resolve artist id per unique track by calling Spotify
      // Limit number of lookups to avoid long running requests
      const uniqueTrackIds = Array.from(new Set(rows.map(s => s.track_id))).slice(0, 200);
      const axios = require('axios');
      const lookups = await Promise.allSettled(uniqueTrackIds.map(trackId =>
        axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
          headers: { Authorization: `Bearer ${user.access_token}` }
        }).then(r => r.data?.artists?.[0]?.id || null).catch(() => null)
      ));
      lookups.forEach(l => { if (l.status === 'fulfilled' && l.value) uniqueArtistIds.add(l.value); });
    }

    const totalArtists = uniqueArtistIds.size;
    console.log('🟢 [Profile] Unique artist ids count:', totalArtists);

    // Calculate rank based on total hours
    let rank = 'bronze';
    if (totalHours >= 1000) rank = 'diamond';
    else if (totalHours >= 500) rank = 'platinum';
    else if (totalHours >= 100) rank = 'gold';
    else if (totalHours >= 50) rank = 'silver';

    const responseData = {
      user_id: user.id,
      spotify_id: user.spotify_id,
      username: spotifyProfile.data.display_name || user.spotify_id,
      avatar_url: spotifyProfile.data.images?.[0]?.url || 'https://i.pravatar.cc/300',
      rank: rank,
      total_hours: totalHours,
      total_ms: totalMs,
      current_month_hours: monthHours,
      current_week_hours: weekHours,
      total_artists: totalArtists
    };

    console.log('🟢 [Profile] Respuesta final:', JSON.stringify(responseData, null, 2));
    res.json(responseData);
  } catch (err) {
    console.error('Profile error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.stats = async (req, res) => {
  const user = req.user;
  try {
    // total accumulated time
    const { data: agg } = await supabase
      .from('listening_sessions')
      .select('sum_total:total_ms', { count: 'exact' })
      .eq('user_id', user.id);

    // top tracks
    const { data: top } = await supabase
      .from('listening_sessions')
      .select('track_id, SUM(total_ms) as sum_ms')
      .eq('user_id', user.id)
      .group('track_id')
      .order('sum_ms', { ascending: false })
      .limit(5);

    // most listened track
    const topTrack = (top && top[0]) ? top[0] : null;

    res.json({
      total_accumulated_ms: agg && agg[0] && agg[0].sum_total ? Number(agg[0].sum_total) : 0,
      top_5: top || [],
      most_listened: topTrack || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.topArtists = async (req, res) => {
  const user = req.user;
  try {
    console.log('🔵 [TopArtists] Obteniendo top artistas para user_id:', user.id);

    // Get all sessions with artist info and aggregate by artist
    const { data: sessions, error } = await supabase
      .from('listening_sessions')
      .select('artist_name, artist_id, total_ms')
      .eq('user_id', user.id)
      .not('artist_name', 'is', null);

    if (error) {
      console.error('🔴 [TopArtists] Error:', error);
      return res.status(500).json({ error: 'Error fetching artists' });
    }

    console.log('🟢 [TopArtists] Sesiones encontradas:', sessions?.length || 0);

    // Aggregate by artist
    const artistMap = new Map();
    (sessions || []).forEach(session => {
      const artist = session.artist_name;
      const current = artistMap.get(artist) || { 
        name: artist, 
        artist_id: session.artist_id,
        total_ms: 0 
      };
      current.total_ms += session.total_ms || 0;
      artistMap.set(artist, current);
    });

    // Convert to array and sort
    const topArtists = Array.from(artistMap.values())
      .sort((a, b) => b.total_ms - a.total_ms)
      .slice(0, 5)
      .map((artist, index) => {
        const hours = Math.floor(artist.total_ms / (1000 * 60 * 60));
        console.log(`🟢 [TopArtists] #${index + 1}: ${artist.name} - ${hours}h`);
        return {
          id: artist.artist_id || artist.name,
          name: artist.name,
          hours: hours,
          total_ms: artist.total_ms
        };
      });

    // Get images from Spotify API for the top artists
    if (user.access_token) {
      const axios = require('axios');
      for (let artist of topArtists) {
        if (artist.id && artist.id !== artist.name) {
          try {
            const spotifyArtist = await axios.get(`https://api.spotify.com/v1/artists/${artist.id}`, {
              headers: { Authorization: `Bearer ${user.access_token}` }
            });
            artist.image_url = spotifyArtist.data.images?.[0]?.url || null;
          } catch (err) {
            console.error('Error fetching artist image:', err.message);
          }
        }
      }
    }

    console.log('🟢 [TopArtists] Respuesta final:', topArtists.length, 'artistas');
    res.json({ artists: topArtists });
  } catch (err) {
    console.error('🔴 [TopArtists] Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
