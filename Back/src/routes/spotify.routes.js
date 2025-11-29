// src/routes/spotify.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const spotifyCtrl = require('../controllers/spotify.controller');

// GET /spotify/recommendations
router.get('/recommendations', auth, spotifyCtrl.recommendations);

module.exports = router;
