const router = require("express").Router();
const { requireAuth } = require("../middleware/auth");
const playlistController = require("../controllers/playlistController");

router.get("/", requireAuth, playlistController.getPlaylists);
router.post("/", requireAuth, playlistController.createPlaylist);
router.patch("/:id", requireAuth, playlistController.updatePlaylist);
router.delete("/:id", requireAuth, playlistController.deletePlaylist);
router.post("/:id/songs", requireAuth, playlistController.addSongToPlaylist);
router.delete(
  "/:id/songs/:songId",
  requireAuth,
  playlistController.removeSongFromPlaylist,
);

module.exports = router;
