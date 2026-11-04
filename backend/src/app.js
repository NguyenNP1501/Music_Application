const express = require("express");
const cors = require("cors");
const prisma = require("./config/prisma");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const catalogRoutes = require("./routes/catalogRoutes");
const playlistRoutes = require("./routes/playlistRoutes");
const roomRoutes = require("./routes/roomRoutes");
const socialRoutes = require("./routes/socialRoutes");

const path = require("path");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN
      ? process.env.CLIENT_ORIGIN.split(",").map((x) => x.trim())
      : true,
  }),
);

app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.json({
    name: "Music Application API",
    status: "running",
  });
});

app.get("/api/health", async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    next(error);
  }
});

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", catalogRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api", socialRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Không tìm thấy API." });
});

app.use(errorHandler);

module.exports = app;
