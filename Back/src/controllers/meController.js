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
