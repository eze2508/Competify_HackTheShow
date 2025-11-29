// src/routes/tracks.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const tracksCtrl = require('../controllers/tracksController');

router.get('/:trackId/top', auth, tracksCtrl.topListeners);

module.exports = router;
