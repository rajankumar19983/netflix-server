import { Server } from "socket.io";
import Chat from "../app/models/chat-model.js";

export const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket"],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  const activeUsers = new Map(); // Track userId => socketId
  const watchParties = {}; // { roomId: [ { userId, username, isHost } ] }
  const ringingCalls = new Map(); // Stores callerId -> receiverId
  const ongoingCalls = new Map(); // callId -> { participants }

  // User joins a personal room using their userId
  io.on("connection", (socket) => {
    // User connects to application
    socket.on("joinApp", async (userId) => {
      if (!userId) return;

      const userIdStr = userId.toString();
      socket.join(userIdStr);
      activeUsers.set(userIdStr, socket.id);

      // Fetch undelivered messages that someone sent me
      const undeliveredMessages = await Chat.find({
        receiverId: userId,
        status: "sent",
      });

      // deliver those messages
      if (undeliveredMessages.length > 0) {
        socket.emit("messageReceived", undeliveredMessages);
      }

      // notifying all senders that msg was delivered to me
      undeliveredMessages.forEach((msg) => {
        const senderSocketId = activeUsers.get(msg.senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageStatusUpdate", {
            messageId: msg._id,
            status: "delivered",
          });
        }
      });

      // Bulk update all undelivered messages to "delivered"
      await Chat.updateMany(
        { receiverId: userId, status: "sent" },
        { $set: { status: "delivered" } }
      );
    });
    socket.on("sendMessage", async (messageData, callback) => {
      try {
        let savedMessage = await Chat.create({
          ...messageData,
          status: "sent",
        });
        callback(savedMessage);

        // if receiver is online, update status to delivered
        const receiverSocketId = activeUsers.get(messageData.receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("messageReceived", savedMessage);

          await Chat.findByIdAndUpdate(savedMessage._id, {
            status: "delivered",
          });

          io.to(activeUsers.get(messageData.senderId)).emit(
            "messageStatusUpdate",
            {
              messageId: savedMessage._id,
              status: "delivered",
            }
          );
        }
      } catch (err) {
        console.error("Error sending message:", err);
      }
    });
    socket.on("markAsRead", async ({ senderId, receiverId }) => {
      const unreadMessages = await Chat.find({
        senderId,
        receiverId,
        status: "delivered",
      });

      if (unreadMessages.length > 0) {
        await Chat.updateMany(
          { senderId, receiverId, status: "delivered" },
          { $set: { status: "read" } }
        );
        const senderSocketId = activeUsers.get(senderId);
        if (senderSocketId) {
          unreadMessages.forEach((msg) => {
            io.to(senderSocketId).emit("messageStatusUpdate", {
              messageId: msg._id, // ✅ Now correctly sending message ID
              status: "read",
            });
          });
        }
      }
    });
    // Send a call request
    socket.on("callUser", ({ caller, receiver, callId }) => {
      const receiverSocket = activeUsers.get(receiver.id);
      if (receiverSocket) {
        io.to(receiverSocket).emit("incomingCall", {
          caller,
          receiver,
          callId,
        });
        ringingCalls.set(callId, { caller, receiver });
        // Auto-end call after 30 sec if unanswered
        setTimeout(() => {
          if (ongoingCalls.get(callId) === undefined) {
            io.to(activeUsers.get(caller.id)).emit("callEnded", { callId });
            io.to(receiverSocket).emit("callEnded", { callId });
            ringingCalls.delete(callId);
          }
        }, 30000);
      }
    });
    // Allow inviting other users to the ongoing call
    // socket.on("addParticipant", ({ callId, newParticipantId }) => {
    //   const newParticipantSocket = activeUsers.get(newParticipantId);
    //   if (newParticipantSocket) {
    //     io.to(newParticipantSocket).emit("joinCall", { callId });
    //     ongoingCalls.get(callId).push(newParticipantId);
    //   }
    // });
    // Accept the call and send back the answer
    socket.on("acceptCall", ({ caller, receiver, callId }) => {
      const callerSocket = activeUsers.get(caller.id);
      if (callerSocket) {
        io.to(callerSocket).emit("callAccepted", { receiver, callId });
      }
      ongoingCalls.set(callId, { caller, receiver });
    });
    socket.on("rejectCall", ({ caller, receiver, callId }) => {
      const callerSocketId = activeUsers.get(caller.id);
      if (callerSocketId) {
        io.to(callerSocketId).emit("callRejected", {
          callId,
        });
      }
    });
    socket.on("endCall", ({ callId }) => {
      if (ongoingCalls.has(callId)) {
        const { caller, receiver } = ongoingCalls.get(callId);
        const callerSocket = activeUsers.get(caller.id);
        const receiverSocket = activeUsers.get(receiver.id);
        if (callerSocket) io.to(callerSocket).emit("callEnded", { callId });
        if (receiverSocket) io.to(receiverSocket).emit("callEnded", { callId });
        // ongoingCalls.get(callId).forEach((userId) => {
        //   io.to(activeUsers.get(userId).emit("callEnded", { callId }));
        // });
        ongoingCalls.delete(callId);
      } else if (ringingCalls.has(callId)) {
        const { caller, receiver } = ringingCalls.get(callId);
        const callerSocket = activeUsers.get(caller.id);
        const receiverSocket = activeUsers.get(receiver.id);
        if (callerSocket) io.to(callerSocket).emit("callEnded", { callId });
        if (receiverSocket) io.to(receiverSocket).emit("callEnded", { callId });
        ringingCalls.delete(callId);
      }
    });
    // Handle user leaving the call
    socket.on("leaveCall", ({ userId, callId }) => {
      if (!ongoingCalls.has(callId)) return;

      const participants = ongoingCalls.get(callId);
      const updatedParticipants = participants.filter((id) => id !== userId);

      // Notify remaining participants
      updatedParticipants.forEach((remainingUserId) => {
        io.to(activeUsers.get(remainingUserId)).emit("userLeftCall", {
          userId,
          callId,
        });
      });
      // Update the call list
      if (updatedParticipants.length === 0) {
        ongoingCalls.delete(callId);
      } else {
        ongoingCalls.set(callId, updatedParticipants);
      }
    });
    // Handle webrtc-offer
    socket.on("webrtc-offer", ({ offer, callId, sender, receiver }) => {
      io.to(activeUsers.get(receiver.id)).emit("webrtc-offer", {
        offer,
        callId,
        sender,
        receiver,
      });
    });
    socket.on("webrtc-answer", ({ answer, receiver }) => {
      io.to(activeUsers.get(receiver.id)).emit("webrtc-answer", { answer });
    });
    // Handle ice-candidate
    socket.on("ice-candidate", ({ candidate, receiver, callId }) => {
      io.to(activeUsers.get(receiver.id)).emit("ice-candidate", { candidate });
    });
    // Handle screen sharing
    socket.on("screen-sharing-started", ({ caller, receiver, callId }) => {
      const participants = ongoingCalls.get(callId);
      if (participants) {
        const userIds = Object.values(participants).map((p) => p.id);
        userIds.forEach((userId) => {
          if (userId !== socket.id) {
            io.to(activeUsers.get(userId)).emit("screen-sharing-started", {
              caller,
              receiver,
              callId,
            });
          }
        });
      }
    });
    socket.on("screen-sharing-stopped", ({ caller, receiver, callId }) => {
      const participants = ongoingCalls.get(callId);
      if (participants) {
        const userIds = Object.values(participants).map((p) => p.id);
        userIds.forEach((userId) => {
          if (userId !== socket.id) {
            io.to(activeUsers.get(userId)).emit("screen-sharing-stopped", {
              caller,
              receiver,
              callId,
            });
          }
        });
      }
    });

    socket.on("screen-share-stopped", ({ to }) => {
      io.to(to).emit("screen-share-stopped");
    });
    // Host creates a watch party
    socket.on("startWatchParty", ({ roomId, userId }) => {
      watchParties[roomId] = {
        host: userId,
        mediaType: null,
        mediaId: null,
        videoId: null,
        participants: [{ userId, isHost: true }],
      };
      socket.join(roomId);
    });
    socket.on("closeWatchParty", ({ roomId, userId }) => {
      if (!watchParties[roomId]) return;

      if (userId !== watchParties[roomId].host) {
        return;
      }

      delete watchParties[roomId];
      io.to(roomId).emit("watchPartyClosed");
    });
    // User joins a specific watch party room
    socket.on("joinWatchParty", ({ roomId, userId }) => {
      if (!watchParties[roomId]) {
        return;
      }
      const isAlreadyInParty = watchParties[roomId].participants.some(
        (p) => p.userId === userId
      );
      if (!isAlreadyInParty) {
        watchParties[roomId].participants.push({ userId, isHost: false });
      }
      socket.join(roomId);
      io.to(roomId).emit("UserJoined", { userId });
    });
    // Handle user leaving
    socket.on("leaveWatchParty", ({ roomId, userId }) => {
      if (!watchParties[roomId]) return;

      // Remove the user from the participants list
      watchParties[roomId].participants = watchParties[
        roomId
      ].participants.filter((p) => p.userId !== userId);
      socket.leave(roomId);
      io.to(roomId).emit("userLeft", { userId });

      // If the host leaves, delete the room
      // if (userId === watchParties[roomId].host) {
      //   console.log(`🏠 Host left. Closing watch party: ${roomId}`);
      //   delete watchParties[roomId];
      //   io.to(roomId).emit("watchPartyClosed");
      // }
    });
    // When user selects media
    socket.on("selectMedia", ({ roomId, userId, mediaType, mediaId }) => {
      const party = watchParties[roomId];
      if (!party) {
        return;
      }
      if (userId !== party.host) {
        return;
      }
      party.mediaType = mediaType;
      party.mediaId = mediaId;
      party.videoId = null;

      io.to(roomId).emit("mediaSelected", {
        mediaType,
        mediaId,
        videoId: null,
      });
    });
    // When user clicks on a specific video
    socket.on("selectVideo", ({ roomId, userId, videoId }) => {
      const party = watchParties[roomId];

      if (!party) {
        return;
      }
      if (userId !== party.host) {
        return;
      }
      party.videoId = videoId;

      io.to(roomId).emit("videoSelected", { videoId });
    });
    // Handle closing of a video
    socket.on("closeVideo", ({ roomId, userId }) => {
      const party = watchParties[roomId];

      if (!party) {
        return;
      }

      if (userId !== party.host) {
        return;
      }

      party.videoId = null;

      // videoClosed is not listened by participants. Will work on it if required
      io.to(roomId).emit("videoClosed");
    });
    socket.on("sync-play", ({ roomId, userId, currentTime, timeStamp }) => {
      const party = watchParties[roomId];
      if (!party) {
        return;
      }
      if (userId !== party.host) {
        return;
      }

      socket.broadcast.to(roomId).emit("sync-play", { currentTime, timeStamp });
    });
    socket.on("sync-pause", ({ roomId, userId, currentTime, timeStamp }) => {
      const party = watchParties[roomId];
      if (!party) {
        return;
      }
      if (userId !== party.host) {
        return;
      }

      socket.broadcast
        .to(roomId)
        .emit("sync-pause", { currentTime, timeStamp });
    });
    // Sync video time for others (host's timestamp)
    socket.on("syncTime", ({ roomId, timestamp }) => {
      socket.broadcast.to(roomId).emit("syncTime", { timestamp });
    });
    // User disconnects from application
    socket.on("disconnect", () => {
      let disconnectedUserId = null;
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          activeUsers.delete(userId);
          break;
        }
      }
      if (!disconnectedUserId) {
        return;
      }
      for (const [roomId, roomData] of Object.entries(watchParties)) {
        if (!roomData.participants) continue; // Ensure participants exist
        const userIndex = roomData.participants.findIndex(
          (p) => p.userId === disconnectedUserId
        );
        if (userIndex !== -1) {
          const user = roomData.participants[userIndex];
          roomData.participants.splice(userIndex, 1);
          io.to(roomId).emit("userLeft", {
            userId: disconnectedUserId,
            roomId,
          });

          // If no participants left, remove the watch party
          if (roomData.participants.length === 0) {
            delete watchParties[roomId];
          }
        }
      }

      for (const [callId, participants] of ongoingCalls.entries()) {
        const participantIds = Object.values(participants);
        if (participantIds.includes(disconnectedUserId)) {
          // Notify remaining participants that the user left
          for (const userId of participantIds) {
            if (userId !== disconnectedUserId) {
              const socketId = activeUsers.get(userId);
              if (socketId) {
                io.to(socketId).emit("userLeftCall", {
                  userId: disconnectedUserId,
                  callId,
                });
              }
            }
          }
          delete participants[disconnectedUserId];
          if (Object.values(participants).length === 0) {
            ongoingCalls.delete(callId);
          } else {
            ongoingCalls.set(callId, participants);
          }
        }
      }
    });
  });
  // Utility function to notify a specific user
  const notifyUser = (userId, event, payload) => {
    const userSocket = activeUsers.get(userId.toString());
    if (userSocket) {
      io.to(userSocket).emit(event, payload);
    } else {
      console.warn(`⚠️ User ${userId} is not connected!`);
    }
  };

  return { io, notifyUser };
};
