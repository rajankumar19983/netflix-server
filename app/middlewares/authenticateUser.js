import jwt from "jsonwebtoken";
// import User from "../models/user-model.js";

const authenticateUser = async (req, res, next) => {
  let token = req.headers["authorization"];
  if (!token) {
    return res.status(401).json({ errors: "Unauthorized - Token not found" });
  }
  token = token.split(" ")[1];
  try {
    const tokenData = jwt.verify(token, process.env.JWT_SECRET);
    if (!tokenData) {
      return res.status(401).json({ errors: "Unauthorized - Invalid token" });
    }
    req.currentUser = { _id: tokenData._id, username: tokenData?.username };
    next();
  } catch (err) {
    return res.status(500).json({ errors: err.message });
  }
};

export default authenticateUser;
