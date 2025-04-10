import "dotenv/config";
import express from "express";
import cors from "cors";
import ConfigDB from "./config/db.js";
import http from "http";
import { setupSocket } from "./config/socketSetup.js";

const app = express();

ConfigDB();
app.use(express.json());
app.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
  })
);

const server = http.createServer(app);
const { notifyUser } = setupSocket(server);

app.use((req, res, next) => {
  req.notifyUser = notifyUser;
  next();
});

app.use((req, res, next) => {
  req.setTimeout(15000); // Increase request timeout to 15s
  next();
});
const PORT = process.env.PORT || 4010;

import userRoutes from "./routes/user-routes.js";
import movieRoutes from "./routes/movie-routes.js";
import tvRoutes from "./routes/tv-routes.js";
import searchRoutes from "./routes/search-routes.js";
import configRoutes from "./routes/config-routes.js";
import categoryRoutes from "./routes/category-routes.js";
import notificationRoutes from "./app/controllers/notification-controller.js";
import chatRoutes from "./app/controllers/chat-controller.js";

// middleware
import authenticateUser from "./app/middlewares/authenticateUser.js";
// import authorizeUser from "./app/middlewares/authorizeUser.js";

app.use("/api/users", userRoutes);
app.use("/api/config", configRoutes);
app.use("/api/movie", authenticateUser, movieRoutes);
app.use("/api/tv", authenticateUser, tvRoutes);
app.use("/api/search", authenticateUser, searchRoutes);
app.use("/api/category", authenticateUser, categoryRoutes);
app.use("/api/notification", authenticateUser, notificationRoutes);
app.use("/api/chat", authenticateUser, chatRoutes);

server.listen(PORT, () => {
  console.log(`Server is running and listening at port ${PORT}`);
});
