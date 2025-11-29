// src/routes/search.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const searchCtrl = require('../controllers/searchController');

router.get('/', auth, searchCtrl.search);

module.exports = router;
