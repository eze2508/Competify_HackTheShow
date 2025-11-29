const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const artistsCtrl = require('../controllers/artistsController');

// GET /artists/top - obtener top artistas del usuario
router.get('/top', auth, artistsCtrl.getTopArtists);

// GET /artists/tracked - obtener artistas trackeados por el usuario
router.get('/tracked', auth, artistsCtrl.getTrackedArtists);

// POST /artists/track - trackear un artista
router.post('/track', auth, artistsCtrl.trackArtist);

// DELETE /artists/track/:artistId - dejar de trackear un artista
router.delete('/track/:artistId', auth, artistsCtrl.untrackArtist);

// GET /artists/discover - descubrir artistas (recomendaciones)
router.get('/discover', auth, artistsCtrl.discoverArtists);

// GET /artists/similar - obtener artistas similares a tu top artista
router.get('/similar', auth, artistsCtrl.getSimilarArtists);

module.exports = router;
