const friendsService = require('../services/friends');

module.exports = {
  sendRequest: async (req, res) => {
    const userId = req.user.id;
    const { toUserId, to_user } = req.body;
    const targetUserId = toUserId || to_user;

    const result = await friendsService.sendRequest(userId, targetUserId);
    res.json(result);
  },

  acceptRequest: async (req, res) => {
    const userId = req.user.id;
    const { requestId, request_id } = req.body;
    const reqId = requestId || request_id;

    const result = await friendsService.acceptRequest(userId, reqId);
    res.json(result);
  },

  rejectRequest: async (req, res) => {
    const userId = req.user.id;
    const { requestId, request_id } = req.body;
    const reqId = requestId || request_id;

    const result = await friendsService.rejectRequest(userId, reqId);
    res.json(result);
  },

  cancelRequest: async (req, res) => {
    const userId = req.user.id;
    const { requestId, request_id } = req.body;
    const reqId = requestId || request_id;

    const result = await friendsService.cancelRequest(userId, reqId);
    res.json(result);
  },

  listFriends: async (req, res) => {
    const userId = req.user.id;
    const result = await friendsService.listFriends(userId);
    res.json({ friends: result || [] });
  },

  listReceived: async (req, res) => {
    const userId = req.user.id;
    const result = await friendsService.listReceived(userId);
    res.json({ requests: result || [] });
  },

  listSent: async (req, res) => {
    const userId = req.user.id;
    const result = await friendsService.listSent(userId);
    res.json({ requests: result || [] });
  },

  removeFriend: async (req, res) => {
    const userId = req.user.id;
    const { friendId, friend_user_id } = req.body;
    const targetFriendId = friendId || friend_user_id;

    const result = await friendsService.removeFriend(userId, targetFriendId);
    res.json(result);
  }
};
