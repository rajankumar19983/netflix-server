import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      unique: true,
    },
    image: {
      type: String,
      default: "",
    },
    // friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
    // friendRequests: [{ type: Schema.Types.ObjectId, ref: "User" }],
    // sentRequests: [{ type: Schema.Types.ObjectId, ref: "User" }],
    friends: [{ type: String }],
    friendRequests: [{ type: String }],
    sentRequests: [{ type: String }],
  },
  { timestamps: true }
);

const User = model("User", userSchema);
export default User;
