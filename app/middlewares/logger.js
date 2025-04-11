import useragent from "useragent";
import Log from "../models/log-model.js";

const logRequest = async (req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const ua = useragent.parse(req.headers["user-agent"]);
  const userId = req.user ? req.user._id : null; // if using auth

  const logEntry = new Log({
    ip,
    method: req.method,
    url: req.originalUrl,
    device: ua.device.toString(),
    os: ua.os.toString(),
    browser: ua.toAgent(),
    userId,
  });

  try {
    await logEntry.save();
  } catch (err) {
    console.error("Failed to save log:", err);
  }

  next();
};

export default logRequest;
