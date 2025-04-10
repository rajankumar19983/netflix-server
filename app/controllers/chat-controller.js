import express from "express";
import Chat from "../models/chat-model.js";

const router = express.Router();

router.get("/history/:userId/:friendId", async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const messages = await Chat.find({
      $or: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
    })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.status(200).json(messages.reverse());
  } catch (err) {
    res.status(500).json({ errors: "Failed to fetch messages" });
  }
});

export default router;
