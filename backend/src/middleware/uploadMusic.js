const multer = require("multer");
const path = require("path");

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const uploadMusic = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },

  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();

    if (ext !== ".mp3") {
      return cb(new Error("Chỉ chấp nhận file có phần mở rộng .mp3."));
    }

    const allowedMimeTypes = [
      "audio/mpeg",
      "audio/mp3",
      "application/octet-stream",
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Định dạng file không được hỗ trợ."));
    }

    cb(null, true);
  },
});

module.exports = { uploadMusic };
