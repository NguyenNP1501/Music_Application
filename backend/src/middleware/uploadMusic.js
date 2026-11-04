const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDir = path.join(__dirname, "../../uploads/music");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, _file, cb) => cb(null, `${crypto.randomUUID()}.mp3`),
});

const uploadMusic = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (
      ext !== ".mp3" ||
      !["audio/mpeg", "audio/mp3", "application/octet-stream"].includes(
        file.mimetype,
      )
    ) {
      return cb(new Error("Chỉ chấp nhận file MP3."));
    }
    cb(null, true);
  },
});

module.exports = { uploadMusic, uploadDir };
