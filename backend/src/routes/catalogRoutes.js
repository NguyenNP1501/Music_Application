const router = require("express").Router();
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { uploadMusic } = require("../middleware/uploadMusic");
const catalogController = require("../controllers/catalogController");

// Xử lý lỗi upload từ Multer
const handleMusicUpload = (req, res, next) => {
  uploadMusic.single("audio")(req, res, (error) => {
    if (error) return res.status(400).json({ message: error.message });
    next();
  });
};

// Songs
router.post(
  "/songs/upload",
  requireAuth,
  requireAdmin,
  handleMusicUpload,
  catalogController.uploadSong,
);

router.get("/songs", catalogController.getSongs);
router.get("/songs/:id", catalogController.getSongById);

// API cũ: giữ lại để trả thông báo 410
router.post("/songs", requireAuth, requireAdmin, catalogController.createSong);

// Cập nhật thông tin và có thể thay file MP3 cùng lúc
router.patch(
  "/songs/:id",
  requireAuth,
  requireAdmin,
  handleMusicUpload,
  catalogController.updateSong,
);

router.delete(
  "/songs/:id",
  requireAuth,
  requireAdmin,
  catalogController.deleteSong,
);

// Albums
router.get("/albums", catalogController.getAlbums);
router.post("/albums", requireAuth, catalogController.createAlbum);
router.patch("/albums/:id", requireAuth, catalogController.updateAlbum);
router.delete("/albums/:id", requireAuth, catalogController.deleteAlbum);

// Artists
router.get("/artists", catalogController.getArtists);

module.exports = router;
