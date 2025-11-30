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
      .eq('user_id', user.id)
      .not('artist_id', 'is', null)
      .not('artist_name', 'is', null);

    if (error) throw error;

    // Mapear al formato esperado por el frontend, filtrando artistas sin ID o nombre
    const artists = (tracked || [])
      .filter(artist => artist.artist_id && artist.artist_name)
      .map(artist => ({
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

    // Validar que artistId y artistName no sean undefined, null o vacíos
    if (!artistId || !artistName || artistId === 'undefined' || artistName === 'undefined') {
      return res.status(400).json({ error: 'artistId and artistName required and cannot be undefined' });
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

    // Estrategia: Obtener artistas de medium_term que no están en short_term
    const [shortTermResponse, mediumTermResponse] = await Promise.all([
      axios.get('https://api.spotify.com/v1/me/top/artists', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 10, time_range: 'short_term' }
      }),
      axios.get('https://api.spotify.com/v1/me/top/artists', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 30, time_range: 'medium_term' }
      })
    ]);

    const shortTermArtists = shortTermResponse.data.items || [];
    const mediumTermArtists = mediumTermResponse.data.items || [];
    
    if (mediumTermArtists.length === 0) {
      return res.json([]);
    }

    // IDs de artistas que ya están en short_term
    const shortTermIds = new Set(shortTermArtists.map(a => a.id));
    
    // Filtrar artistas de medium_term que NO están en short_term (descubrimientos)
    const discoverArtists = mediumTermArtists
      .filter(artist => !shortTermIds.has(artist.id))
      .slice(0, 20)
      .map(artist => ({
        id: artist.id,
        name: artist.name,
        imageUrl: artist.images[0]?.url || null,
        genres: artist.genres || [],
        followers: artist.followers?.total || 0,
        popularity: artist.popularity || 0
      }));

    res.json(discoverArtists);
  } catch (err) {
    console.error('discoverArtists error:', err.response?.data || err.message);
    // En caso de error, devolver array vacío en lugar de 500
    res.json([]);
  }
};

/**
 * GET /artists/similar - Obtiene artistas similares por género a tus top artistas
 */
exports.getSimilarArtists = async (req, res) => {
  try {
    const user = req.user;
    const accessToken = await ensureValidToken(user);

    // Obtener top artistas del usuario
    const topResponse = await axios.get('https://api.spotify.com/v1/me/top/artists', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { limit: 5, time_range: 'short_term' }
    });

    const topArtists = topResponse.data.items;
    
    if (!topArtists || topArtists.length === 0) {
      return res.json({ artists: [], basedOn: null });
    }

    // Extraer todos los géneros de los top artistas
    const allGenres = new Set();
    topArtists.forEach(artist => {
      if (artist.genres && artist.genres.length > 0) {
        artist.genres.forEach(genre => allGenres.add(genre));
      }
    });

    if (allGenres.size === 0) {
      // Si no hay géneros, devolver vacío
      return res.json({ artists: [], basedOn: null });
    }

    // Obtener IDs de los top artistas para filtrarlos después
    const topArtistIds = new Set(topArtists.map(a => a.id));

    // Buscar artistas por los géneros más comunes
    const genresList = Array.from(allGenres).slice(0, 3); // Usar los primeros 3 géneros
    const searchQueries = genresList.map(genre => 
      axios.get('https://api.spotify.com/v1/search', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { 
          q: `genre:"${genre}"`, 
          type: 'artist',
          limit: 10
        }
      })
    );

    const searchResults = await Promise.allSettled(searchQueries);
    
    // Recolectar todos los artistas encontrados
    const foundArtists = [];
    searchResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value.data.artists?.items) {
        result.value.data.artists.items.forEach(artist => {
          // No incluir artistas que ya están en el top del usuario
          if (!topArtistIds.has(artist.id)) {
            foundArtists.push(artist);
          }
        });
      }
    });

    // Eliminar duplicados por ID y ordenar por popularidad
    const uniqueArtists = [];
    const seenIds = new Set();
    
    foundArtists
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .forEach(artist => {
        if (!seenIds.has(artist.id)) {
          seenIds.add(artist.id);
          uniqueArtists.push(artist);
        }
      });

    // Mapear y limitar a 20 artistas
    const mappedArtists = uniqueArtists
      .slice(0, 20)
      .map(artist => ({
        id: artist.id,
        name: artist.name,
        imageUrl: artist.images[0]?.url || null,
        genres: artist.genres || [],
        followers: artist.followers?.total || 0,
        popularity: artist.popularity || 0
      }));

    res.json({
      artists: mappedArtists,
      basedOn: {
        id: topArtists[0].id,
        name: topArtists[0].name,
        imageUrl: topArtists[0].images[0]?.url || null
      }
    });
  } catch (err) {
    console.error('getSimilarArtists error:', err.response?.data || err.message);
    res.json({ artists: [], basedOn: null });
  }
};
