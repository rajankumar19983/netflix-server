import { Schema, model } from "mongoose";

const logSchema = new Schema(
  {
    timestamp: { type: Date, default: Date.now },
    ip: String,
    method: String,
    url: String,
    device: String,
    os: String,
    browser: String,
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    }, // if logged in
  },
  { timestamps: true }
);

const Log = model("Log", logSchema);
export default Log;
