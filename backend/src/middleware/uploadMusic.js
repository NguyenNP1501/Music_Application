const multer = require("multer");
const path = require("path");

const uploadMusic = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const allowedMimeTypes = [
      "audio/mpeg",
      "audio/mp3",
      "application/octet-stream",
    ];

    if (ext !== ".mp3" || !allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Chỉ chấp nhận file MP3."));
    }

    cb(null, true);
  },
});

module.exports = { uploadMusic };
