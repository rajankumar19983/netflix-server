import User from "../models/user-model.js";
import bcryptjs from "bcryptjs";
import { validationResult } from "express-validator";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import cloudinary from "../../config/cloudinary.js";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import Notification from "../models/notification-model.js";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, res) => ({
    folder: "Netflix/users",
    allowed_formats: ["jpg", "png", "jpeg"],
    public_id: `${req.currentUser._id}`,
    overwrite: true,
  }),
});

const userCtlr = {};

userCtlr.upload = multer({ storage });

function generateUniqueId(input, length = 6) {
  const hash = crypto
    .createHash("sha256") // Use a secure hashing algorithm
    .update(input) // Input data for deterministic hashing
    .digest("base64") // Convert to base64 for a shorter hash
    .replace(/[^A-Z0-9]/g, "") // Keep only uppercase letters and numbers
    .slice(0, length); // Truncate to the desired length

  return hash;
}

userCtlr.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { email, password, username } = req.body;
    const salt = await bcryptjs.genSalt();
    const hashedPassword = await bcryptjs.hash(password, salt);

    const newUser = await User.create({
      email,
      password: hashedPassword,
      username,
    });
    newUser.userId = generateUniqueId(newUser._id.toString());
    await newUser.save();
    const token = jwt.sign(
      {
        _id: newUser._id,
        username: newUser.username,
        // role: newUser.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );
    res.json({ token: `Bearer ${token}` });
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

userCtlr.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { loginId, password } = req.body;
    const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegEx.test(loginId);
    const user = await User.findOne({
      [isEmail ? "email" : "username"]: loginId,
    });
    if (!user) {
      return res.status(404).json({ errors: "Invalid credentials" });
    }
    const isPasswordCorrect = await bcryptjs.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ errors: "Invalid credentials" });
    }
    const token = jwt.sign(
      {
        _id: user._id,
        username: user.username,
        // role: newUser.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token: `Bearer ${token}` });
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

userCtlr.findEmail = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ errors: "Email does not exist" });
    }
    return res.status(200).json({ email: user.email });
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

userCtlr.account = async (req, res) => {
  try {
    const user = await User.findById(req.currentUser._id);
    if (!user) {
      return res.status(404).json({ errors: "User not found" });
    }
    res.json({ ...user._doc, password: "" });
  } catch (err) {
    return res.status(401).json({ errors: err.message });
  }
};

userCtlr.uploadImage = async (req, res) => {
  try {
    const _id = req.currentUser._id;
    const img = req.file?.path;
    const response = await User.findByIdAndUpdate(
      { _id },
      { image: img },
      { new: true }
    );
    return res.json(response);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

userCtlr.searchUser = async (req, res) => {
  try {
    let { userId } = req.body;
    userId = userId.toUpperCase();
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ errors: "User not found" });
    }
    return res.status(200).json({
      image: user.image,
      username: user.username,
      userId: user.userId,
      email: user.email,
      _id: user._id,
    });
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

userCtlr.searchUsers = async (req, res) => {
  const { userIds } = req.body;
  try {
    const users = await User.find(
      { userId: { $in: userIds } },
      { image: 1, userId: 1, _id: 1, username: 1, email: 1 }
    );
    res.json(users);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

userCtlr.friendsData = async (req, res) => {
  const userId = req.currentUser._id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ errors: "User not found" });
    }
    return res.status(200).json({
      friends: user.friends,
      friendRequests: user.friendRequests,
      sentRequests: user.sentRequests,
    });
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

userCtlr.sendRequest = async (req, res) => {
  const { id } = req.params;
  const senderId = req.currentUser._id;
  try {
    const sender = await User.findById(senderId);
    const receiver = await User.findOne({ userId: id.toUpperCase() });
    if (!receiver || sender.friends.includes(receiver.userId)) {
      return res.status(400).json({ errors: "Invalid request" });
    }
    if (!receiver.friendRequests.includes(sender.userId)) {
      receiver.friendRequests.push(sender.userId);
    }
    if (!sender.sentRequests.includes(receiver.userId)) {
      sender.sentRequests.push(receiver.userId);
    }

    const notification = new Notification({
      userId: receiver._id,
      type: "friendrequest",
      message: `${req.currentUser.username} sent you a friend request`,
    });
    const savedNotification = await notification.save();

    req.notifyUser(receiver._id.toString(), "friendrequest", savedNotification);

    await sender.save();
    await receiver.save();

    return res.status(200).json({ msg: "Request sent!", id: receiver.userId });
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

userCtlr.revokeRequest = async (req, res) => {
  let { id } = req.params;
  const senderId = req.currentUser._id;
  try {
    const sender = await User.findById(senderId);
    const receiver = await User.findOne({ userId: id.toUpperCase() });
    sender.sentRequests = sender.sentRequests.filter(
      (reqId) => reqId.toString() !== receiver.userId
    );
    receiver.friendRequests = receiver.friendRequests.filter(
      (reqId) => reqId.toString() !== sender.userId
    );
    await sender.save();
    await receiver.save();

    return res
      .status(200)
      .json({ msg: "Request revoked!", id: receiver.userId });
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

userCtlr.acceptRequest = async (req, res) => {
  const { id } = req.params;
  const userId = req.currentUser._id;
  try {
    const receiver = await User.findById(userId);
    const sender = await User.findOne({ userId: id.toUpperCase() });
    if (!receiver.friendRequests.includes(sender.userId))
      return res.status(400).json({ msg: "No request found" });

    receiver.friends.push(sender.userId);
    sender.friends.push(receiver.userId);

    receiver.friendRequests = receiver.friendRequests.filter(
      (reqId) => reqId.toString() !== sender.userId
    );
    sender.sentRequests = sender.sentRequests.filter(
      (reqId) => reqId.toString() !== receiver.userId
    );

    await receiver.save();
    await sender.save();

    const notification = new Notification({
      userId: sender._id,
      type: "requestaccepted",
      message: `${req.currentUser.username} accepted your friend request`,
    });
    const savedNotification = await notification.save();

    req.notifyUser(sender._id.toString(), "requestaccepted", savedNotification);

    res.status(200).json({
      msg: "Friend request accepted!",
      newFriend: { id: sender.userId, username: sender.username },
    });
  } catch (err) {
    res.status(500).json({ errors: "Internal Server Error" });
  }
};

userCtlr.rejectRequest = async (req, res) => {
  const { id } = req.params;
  const userId = req.currentUser._id;
  try {
    const user = await User.findById(userId);
    const sender = await User.findOne({ userId: id.toUpperCase() });

    user.friendRequests = user.friendRequests.filter(
      (reqId) => reqId.toString() !== sender.userId
    );
    sender.sentRequests = sender.sentRequests.filter(
      (reqId) => reqId.toString() !== user.userId
    );
    await user.save();
    await sender.save();
    res
      .status(200)
      .json({ msg: "Friend request rejected!", id: sender.userId });
  } catch (err) {
    res.status(500).json({ errors: "Internal Server Error" });
  }
};

userCtlr.unfriend = async (req, res) => {
  const { id } = req.params;
  const userId = req.currentUser._id;
  try {
    const user = await User.findById(userId);
    const opposite = await User.findOne({ userId: id.toUpperCase() });

    user.friends = user.friends.filter(
      (fId) => fId.toString() !== opposite.userId
    );
    opposite.friends = opposite.friends.filter(
      (fId) => fId.toString() !== user.userId
    );
    await user.save();
    await opposite.save();
    res.status(200).json({ msg: "Unfriended!", id: opposite.userId });
  } catch (err) {
    res.status(500).json({ errors: "Internal Server Error" });
  }
};

export default userCtlr;
