require("dotenv").config();

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

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET phải có ít nhất 32 ký tự trong file .env.");
}

const app = express();
const PORT = Number(process.env.PORT || 3000);

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

const server = app.listen(PORT, () => {
  console.log(`Music Application API đang chạy tại http://localhost:${PORT}`);
});

async function shutdown() {
  console.log("Đang đóng kết nối...");
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
