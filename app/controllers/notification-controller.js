import express from "express";
import Notification from "../models/notification-model.js";

const router = express.Router();

router.get("/getall", async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.currentUser._id,
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/:id/markread", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedNotification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!updatedNotification) {
      return res.status(404).json({ errors: "Notification not found" });
    }

    res.json(updatedNotification);
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
