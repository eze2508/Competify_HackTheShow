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
    try {
      const request = await db.getFriendRequest(requestId);
      console.log('Friend request found:', request);
      
      if (!request || request.to_user !== userId) {
        console.log('Request not found or unauthorized:', { request, userId });
        return { error: "request_not_found" };
      }

      console.log('Accepting friend request:', requestId);
      const updateResult = await db.acceptFriendRequest(requestId);
      console.log('Update result:', updateResult);
      
      console.log('Inserting friends relation:', { from: request.from_user, to: request.to_user });
      const insertResult = await db.insertFriendsRelation(request.from_user, request.to_user);
      console.log('Insert result:', insertResult);

      return { accepted: true };
    } catch (error) {
      console.error('Error in acceptRequest:', error);
      return { error: "server_error", details: error.message };
    }
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
    const friends = await db.listFriends(userId);
    
    // Get names and avatars from Spotify for each friend
    const axios = require('axios');
    const enrichedFriends = await Promise.all(
      friends.map(async (friend) => {
        try {
          if (friend.access_token && friend.spotify_id) {
            // Use the public profile endpoint instead of /me
            const response = await axios.get(`https://api.spotify.com/v1/users/${friend.spotify_id}`, {
              headers: { Authorization: `Bearer ${friend.access_token}` }
            });
            return {
              user_id: friend.id,
              username: response.data.display_name || friend.spotify_id,
              avatar_url: response.data.images?.[0]?.url || null,
              spotify_id: friend.spotify_id
            };
          }
        } catch (error) {
          console.error('Error fetching friend profile:', error.message);
        }
        return {
          user_id: friend.id,
          username: friend.spotify_id,
          avatar_url: null,
          spotify_id: friend.spotify_id
        };
      })
    );
    
    return enrichedFriends;
  },

  // -----------------------------
  // LIST RECEIVED REQUESTS
  // -----------------------------
  listReceived: async (userId) => {
    const requests = await db.listReceivedFriendRequests(userId);
    
    // Get usernames from Spotify for each from_user
    const axios = require('axios');
    const enrichedRequests = await Promise.all(
      requests.map(async (req) => {
        try {
          // Get the user's access token to fetch Spotify profile
          const fromUser = await db.getUserById(req.from_user_id);
          if (fromUser && fromUser.access_token && fromUser.spotify_id) {
            const response = await axios.get(`https://api.spotify.com/v1/users/${fromUser.spotify_id}`, {
              headers: { Authorization: `Bearer ${fromUser.access_token}` }
            });
            return {
              ...req,
              from_user_name: response.data.display_name || req.from_user_spotify_id
            };
          }
        } catch (error) {
          // Si falla, usar el spotify_id como fallback
        }
        return {
          ...req,
          from_user_name: req.from_user_spotify_id
        };
      })
    );
    
    return enrichedRequests;
  },

  // -----------------------------
  // LIST SENT REQUESTS
  // -----------------------------
  listSent: async (userId) => {
    const requests = await db.listSentFriendRequests(userId);
    
    // Get usernames from Spotify for each to_user
    const axios = require('axios');
    const enrichedRequests = await Promise.all(
      requests.map(async (req) => {
        try {
          // Get the user's access token to fetch Spotify profile
          const toUser = await db.getUserById(req.to_user_id);
          if (toUser && toUser.access_token && toUser.spotify_id) {
            const response = await axios.get(`https://api.spotify.com/v1/users/${toUser.spotify_id}`, {
              headers: { Authorization: `Bearer ${toUser.access_token}` }
            });
            return {
              ...req,
              to_user_name: response.data.display_name || req.to_user_spotify_id
            };
          }
        } catch (error) {
          // Si falla, usar el spotify_id como fallback
        }
        return {
          ...req,
          to_user_name: req.to_user_spotify_id
        };
      })
    );
    
    return enrichedRequests;
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
