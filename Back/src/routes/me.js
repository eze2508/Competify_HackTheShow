const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const meCtrl = require('../controllers/meController');

router.get('/current', auth, meCtrl.current);
router.get('/profile', auth, meCtrl.profile);
router.get('/stats', auth, meCtrl.stats);

module.exports = router;
