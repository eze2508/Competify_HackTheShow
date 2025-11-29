const db = require('../db/supabase');

module.exports = {
  // -----------------------------
  //  SEND FRIEND REQUEST
  // -----------------------------
  sendRequest: async (userId, toUserId) => {
    if (userId === toUserId) return { error: "cannot_add_self" };

    // check exists
    const userCheck = await db.getUserById(toUserId);
    if (!userCheck) return { error: "user_not_found" };

    // already friends?
    const alreadyFriends = await db.areFriends(userId, toUserId);
    if (alreadyFriends) return { error: "already_friends" };

    // existing pending request?
    const pending = await db.findPendingFriendRequest(userId, toUserId);
    if (pending) return { error: "request_already_sent" };

    await db.createFriendRequest(userId, toUserId);

    return { request_sent: true };
  },

  // -----------------------------
  //   ACCEPT REQUEST
  // -----------------------------
  acceptRequest: async (userId, requestId) => {
    const request = await db.getFriendRequest(requestId);
    if (!request || request.to_user !== userId)
      return { error: "request_not_found" };

    await db.acceptFriendRequest(requestId);
    await db.insertFriendsRelation(request.from_user, request.to_user);

    return { accepted: true };
  },

  // -----------------------------
  //   REJECT REQUEST
  // -----------------------------
  rejectRequest: async (userId, requestId) => {
    const request = await db.getFriendRequest(requestId);
    if (!request || request.to_user !== userId)
      return { error: "request_not_found" };

    await db.rejectFriendRequest(requestId);
    return { rejected: true };
  },

  // -----------------------------
  //    CANCEL REQUEST
  // -----------------------------
  cancelRequest: async (userId, requestId) => {
    const request = await db.getFriendRequest(requestId);
    if (!request || request.from_user !== userId)
      return { error: "request_not_found" };

    await db.deleteFriendRequest(requestId);
    return { canceled: true };
  },

  // -----------------------------
  //     LIST FRIENDS
  // -----------------------------
  listFriends: async (userId) => {
    return await db.listFriends(userId);
  },

  // -----------------------------
  // LIST RECEIVED REQUESTS
  // -----------------------------
  listReceived: async (userId) => {
    return await db.listReceivedFriendRequests(userId);
  },

  // -----------------------------
  // LIST SENT REQUESTS
  // -----------------------------
  listSent: async (userId) => {
    return await db.listSentFriendRequests(userId);
  },

  // -----------------------------
  // REMOVE FRIEND
  // -----------------------------
  removeFriend: async (userId, friendId) => {
    const friends = await db.areFriends(userId, friendId);
    if (!friends) return { error: "not_friends" };

    await db.removeFriendsRelation(userId, friendId);
    return { removed: true };
  }
};
