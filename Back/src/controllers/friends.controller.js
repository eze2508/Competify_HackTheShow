const friendsService = require('../services/friends');

module.exports = {
  sendRequest: async (req, res) => {
    const userId = req.user.id;
    const { toUserId } = req.body;

    const result = await friendsService.sendRequest(userId, toUserId);
    res.json(result);
  },

  acceptRequest: async (req, res) => {
    const userId = req.user.id;
    const { requestId } = req.body;

    const result = await friendsService.acceptRequest(userId, requestId);
    res.json(result);
  },

  rejectRequest: async (req, res) => {
    const userId = req.user.id;
    const { requestId } = req.body;

    const result = await friendsService.rejectRequest(userId, requestId);
    res.json(result);
  },

  cancelRequest: async (req, res) => {
    const userId = req.user.id;
    const { requestId } = req.body;

    const result = await friendsService.cancelRequest(userId, requestId);
    res.json(result);
  },

  listFriends: async (req, res) => {
    const userId = req.user.id;
    const result = await friendsService.listFriends(userId);
    res.json(result);
  },

  listReceived: async (req, res) => {
    const userId = req.user.id;
    const result = await friendsService.listReceived(userId);
    res.json(result);
  },

  listSent: async (req, res) => {
    const userId = req.user.id;
    const result = await friendsService.listSent(userId);
    res.json(result);
  },

  removeFriend: async (req, res) => {
    const userId = req.user.id;
    const { friendId } = req.body;

    const result = await friendsService.removeFriend(userId, friendId);
    res.json(result);
  }
};
