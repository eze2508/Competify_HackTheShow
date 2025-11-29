const router = require('express').Router();
const requireAuth = require('../middlewares/authMiddleware');
const controller = require('../controllers/friends.controller');

router.post('/request', requireAuth, controller.sendRequest);
router.post('/accept', requireAuth, controller.acceptRequest);
router.post('/reject', requireAuth, controller.rejectRequest);
router.post('/cancel', requireAuth, controller.cancelRequest);
router.get('/list', requireAuth, controller.listFriends);
router.get('/requests/received', requireAuth, controller.listReceived);
router.get('/requests/sent', requireAuth, controller.listSent);
router.post('/remove', requireAuth, controller.removeFriend);

module.exports = router;
