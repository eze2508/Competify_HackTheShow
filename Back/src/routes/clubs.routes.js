// src/routes/clubs.routes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware'); // existing
const requireClubMember = require('../middlewares/requireClubMember');
const clubsCtrl = require('../controllers/clubs.controller');

// Create
router.post('/create', auth, clubsCtrl.createClub);

// Join
router.post('/join', auth, clubsCtrl.joinClub);

// Leave
router.post('/leave', auth, clubsCtrl.leaveClub);

// Search by name
router.get('/search', auth, clubsCtrl.searchClubs);

// List with pagination
router.get('/list', auth, clubsCtrl.listClubs);

// Members
router.get('/:clubId/members', auth, clubsCtrl.getMembers);

// Messages: list
router.get('/:clubId/messages', auth, requireClubMember, clubsCtrl.getMessages);

// Messages: post
router.post('/:clubId/messages', auth, requireClubMember, clubsCtrl.postMessage);

module.exports = router;
