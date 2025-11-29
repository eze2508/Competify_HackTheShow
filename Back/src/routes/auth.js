const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');

router.get('/login', authCtrl.login);
router.get('/callback', authCtrl.callback);

module.exports = router;
