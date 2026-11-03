const router = require("express").Router();
const prisma = require("../config/prisma");
const { requireAuth } = require("../middleware/auth");

const validId = (v) =>
  Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null;

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const playlists = await prisma.playlist.findMany({
      where: {
        OR: [{ Useruser_id: req.user.user_id }, { visibility: "public" }],
      },
      include: {
        user: { select: { user_id: true, full_name: true } },
        songs: { include: { song: { include: { album: true } } } },
      },
      orderBy: { created_at: "desc" },
    });

    res.json({ playlists });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { title, description, cover_image_url, visibility } = req.body;

    if (!title?.trim()) {
      return res
        .status(400)
        .json({ message: "Tên playlist không được để trống." });
    }

    const playlist = await prisma.playlist.create({
      data: {
        title: title.trim(),
        description: description || null,
        cover_image_url: cover_image_url || null,
        visibility: ["public", "private"].includes(visibility)
          ? visibility
          : "private",
        Useruser_id: req.user.user_id,
      },
    });

    res.status(201).json({ playlist });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const playlistId = validId(req.params.id);
    if (!playlistId)
      return res.status(400).json({ message: "ID không hợp lệ." });

    const old = await prisma.playlist.findUnique({
      where: { playlist_id: playlistId },
    });
    if (!old)
      return res.status(404).json({ message: "Không tìm thấy playlist." });

    if (old.Useruser_id !== req.user.user_id) {
      return res
        .status(403)
        .json({ message: "Chỉ chủ playlist mới được sửa." });
    }

    const data = {};
    for (const key of ["title", "description", "cover_image_url"]) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }

    if (req.body.visibility !== undefined) {
      if (!["public", "private"].includes(req.body.visibility)) {
        return res
          .status(400)
          .json({ message: "visibility phải là public hoặc private." });
      }
      data.visibility = req.body.visibility;
    }

    data.updated_at = new Date();

    const playlist = await prisma.playlist.update({
      where: { playlist_id: playlistId },
      data,
    });

    res.json({ playlist });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const playlistId = validId(req.params.id);
    if (!playlistId)
      return res.status(400).json({ message: "ID không hợp lệ." });

    const playlist = await prisma.playlist.findUnique({
      where: { playlist_id: playlistId },
    });
    if (!playlist)
      return res.status(404).json({ message: "Không tìm thấy playlist." });

    if (playlist.Useruser_id !== req.user.user_id) {
      return res
        .status(403)
        .json({ message: "Chỉ chủ playlist mới được xóa." });
    }

    await prisma.playlist.delete({ where: { playlist_id: playlistId } });
    res.json({ message: "Đã xóa playlist." });
  } catch (error) {
    next(error);
  }
});

// Thêm bài hát vào playlist
router.post("/:id/songs", requireAuth, async (req, res, next) => {
  try {
    const playlistId = validId(req.params.id);
    const songId = validId(req.body.song_id);

    if (!playlistId || !songId) {
      return res
        .status(400)
        .json({ message: "ID playlist hoặc bài hát không hợp lệ." });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { playlist_id: playlistId },
    });
    if (!playlist)
      return res.status(404).json({ message: "Không tìm thấy playlist." });

    if (playlist.Useruser_id !== req.user.user_id) {
      return res
        .status(403)
        .json({ message: "Chỉ chủ playlist mới được thêm bài hát." });
    }

    const item = await prisma.playlist_Song.create({
      data: {
        Playlistplaylist_id: playlistId,
        Songsong_id: songId,
      },
    });

    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

// Xóa bài hát khỏi playlist
router.delete("/:id/songs/:songId", requireAuth, async (req, res, next) => {
  try {
    const playlistId = validId(req.params.id);
    const songId = validId(req.params.songId);

    if (!playlistId || !songId) {
      return res.status(400).json({ message: "ID không hợp lệ." });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { playlist_id: playlistId },
    });
    if (!playlist)
      return res.status(404).json({ message: "Không tìm thấy playlist." });

    if (playlist.Useruser_id !== req.user.user_id) {
      return res
        .status(403)
        .json({ message: "Chỉ chủ playlist mới được xóa bài hát." });
    }

    await prisma.playlist_Song.delete({
      where: {
        Playlistplaylist_id_Songsong_id: {
          Playlistplaylist_id: playlistId,
          Songsong_id: songId,
        },
      },
    });

    res.json({ message: "Đã xóa bài hát khỏi playlist." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
