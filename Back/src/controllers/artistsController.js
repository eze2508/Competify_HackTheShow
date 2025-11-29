const supabase = require('../db/supabaseClient');
const axios = require('axios');
const { refreshAccessTokenForUser } = require('../services/spotifyService');

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

/**
 * GET /artists/top - Obtiene los top artistas del usuario desde Spotify
 */
exports.getTopArtists = async (req, res) => {
  try {
    const user = req.user;
    const limit = parseInt(req.query.limit) || 20;
    const time_range = req.query.time_range || 'medium_term'; // short_term, medium_term, long_term

    const accessToken = await ensureValidToken(user);

    // Llamar a Spotify API para obtener top artists
    const response = await axios.get('https://api.spotify.com/v1/me/top/artists', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { limit, time_range }
    });

    const artists = response.data.items.map(artist => ({
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images[0]?.url || null,
      genres: artist.genres || [],
      followers: artist.followers?.total || 0,
      popularity: artist.popularity || 0,
      uri: artist.uri
    }));

    res.json(artists);
  } catch (err) {
    console.error('getTopArtists error:', err.response?.data || err.message);
    const errorDetails = err.response?.data?.error || err.message;
    res.status(500).json({ error: 'Failed to get top artists', details: errorDetails });
  }
};

/**
 * GET /artists/tracked - Obtiene los artistas trackeados por el usuario
 */
exports.getTrackedArtists = async (req, res) => {
  try {
    const user = req.user;

    // Obtener IDs de artistas trackeados de la DB
    const { data: tracked, error } = await supabase
      .from('tracked_artists')
      .select('artist_id, artist_name, artist_image_url, genres')
      .eq('user_id', user.id);

    if (error) throw error;

    // Mapear al formato esperado por el frontend
    const artists = (tracked || []).map(artist => ({
      id: artist.artist_id,
      name: artist.artist_name,
      imageUrl: artist.artist_image_url,
      genres: artist.genres || [],
      followers: 0,
      popularity: 0
    }));

    res.json(artists);
  } catch (err) {
    console.error('getTrackedArtists error:', err.message);
    res.status(500).json({ error: 'Failed to get tracked artists', details: err.message });
  }
};

/**
 * POST /artists/track - Trackear un artista
 * Body: { artistId, artistName, artistImageUrl, genres }
 */
exports.trackArtist = async (req, res) => {
  try {
    const user = req.user;
    const { artistId, artistName, artistImageUrl, genres } = req.body;

    if (!artistId || !artistName) {
      return res.status(400).json({ error: 'artistId and artistName required' });
    }

    // Insertar o actualizar
    const { data, error } = await supabase
      .from('tracked_artists')
      .upsert({
        user_id: user.id,
        artist_id: artistId,
        artist_name: artistName,
        artist_image_url: artistImageUrl || null,
        genres: genres || []
      }, { onConflict: 'user_id,artist_id' });

    if (error) throw error;

    res.json({ success: true, message: 'Artist tracked' });
  } catch (err) {
    console.error('trackArtist error:', err.message);
    res.status(500).json({ error: 'Failed to track artist', details: err.message });
  }
};

/**
 * DELETE /artists/track/:artistId - Dejar de trackear un artista
 */
exports.untrackArtist = async (req, res) => {
  try {
    const user = req.user;
    const { artistId } = req.params;

    const { error } = await supabase
      .from('tracked_artists')
      .delete()
      .eq('user_id', user.id)
      .eq('artist_id', artistId);

    if (error) throw error;

    res.json({ success: true, message: 'Artist untracked' });
  } catch (err) {
    console.error('untrackArtist error:', err.message);
    res.status(500).json({ error: 'Failed to untrack artist', details: err.message });
  }
};

/**
 * GET /artists/discover - Descubrir artistas (recomendaciones)
 */
exports.discoverArtists = async (req, res) => {
  try {
    const user = req.user;
    const accessToken = await ensureValidToken(user);

    // Obtener recomendaciones basadas en top artists y géneros
    const topResponse = await axios.get('https://api.spotify.com/v1/me/top/artists', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { limit: 5, time_range: 'short_term' }
    });

    const topArtists = topResponse.data.items;
    const seedArtistIds = topArtists.map(a => a.id).slice(0, 5);
    const genres = [...new Set(topArtists.flatMap(a => a.genres))].slice(0, 2);

    // Buscar artistas relacionados
    const relatedPromises = seedArtistIds.slice(0, 2).map(artistId => 
      axios.get(`https://api.spotify.com/v1/artists/${artistId}/related-artists`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
    );

    const relatedResponses = await Promise.all(relatedPromises);
    const relatedArtists = relatedResponses.flatMap(r => r.data.artists);

    // Filtrar y mapear artistas únicos
    const uniqueArtists = Array.from(
      new Map(relatedArtists.map(a => [a.id, a])).values()
    ).slice(0, 20);

    const artists = uniqueArtists.map(artist => ({
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images[0]?.url || null,
      genres: artist.genres || [],
      followers: artist.followers?.total || 0,
      popularity: artist.popularity || 0
    }));

    res.json(artists);
  } catch (err) {
    console.error('discoverArtists error:', err.response?.data || err.message);
    const errorDetails = err.response?.data?.error || err.message;
    res.status(500).json({ error: 'Failed to discover artists', details: errorDetails });
  }
};
