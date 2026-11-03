const router = require("express").Router();
const prisma = require("../config/prisma");
const { requireAuth } = require("../middleware/auth");

const validId = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const validDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

// ================= SONGS =================

// Danh sách bài hát và tìm kiếm
router.get("/songs", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();

    const songs = await prisma.song.findMany({
      where: q
        ? {
            OR: [
              { title: { contains: q } },
              { singer: { contains: q } },
              { composer: { contains: q } },
              { genre: { contains: q } },
            ],
          }
        : {},
      include: {
        album: true,
        user: { select: { user_id: true, full_name: true } },
      },
      orderBy: { song_id: "desc" },
      take: 200,
    });

    res.json({ songs });
  } catch (error) {
    next(error);
  }
});

// Chi tiết bài hát
router.get("/songs/:id", async (req, res, next) => {
  try {
    const songId = validId(req.params.id);
    if (!songId) return res.status(400).json({ message: "ID không hợp lệ." });

    const song = await prisma.song.findUnique({
      where: { song_id: songId },
      include: { album: true },
    });

    if (!song)
      return res.status(404).json({ message: "Không tìm thấy bài hát." });
    res.json({ song });
  } catch (error) {
    next(error);
  }
});

// Thêm bài hát
router.post("/songs", requireAuth, async (req, res, next) => {
  try {
    const {
      title,
      release,
      audio_url,
      description,
      genre,
      composer,
      singer,
      Albumalbum_id,
    } = req.body;

    const albumId = validId(Albumalbum_id);
    const releaseDate = validDate(release || new Date());

    if (
      !title?.trim() ||
      !audio_url?.trim() ||
      !genre?.trim() ||
      !composer?.trim() ||
      !singer?.trim() ||
      !albumId ||
      !releaseDate
    ) {
      return res.status(400).json({
        message:
          "Thiếu title, audio_url, genre, composer, singer, Albumalbum_id hoặc release.",
      });
    }

    const album = await prisma.album.findUnique({
      where: { album_id: albumId },
    });
    if (!album)
      return res.status(400).json({ message: "Album không tồn tại." });

    const song = await prisma.song.create({
      data: {
        title: title.trim(),
        release: releaseDate,
        audio_url: audio_url.trim(),
        description: description || null,
        genre: genre.trim(),
        composer: composer.trim(),
        singer: singer.trim(),
        Albumalbum_id: albumId,
        Useruser_id: req.user.user_id,
      },
    });

    res.status(201).json({ song });
  } catch (error) {
    next(error);
  }
});

// Sửa bài hát: chủ sở hữu hoặc admin
router.patch("/songs/:id", requireAuth, async (req, res, next) => {
  try {
    const songId = validId(req.params.id);
    if (!songId) return res.status(400).json({ message: "ID không hợp lệ." });

    const old = await prisma.song.findUnique({ where: { song_id: songId } });
    if (!old)
      return res.status(404).json({ message: "Không tìm thấy bài hát." });

    if (old.Useruser_id !== req.user.user_id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền sửa bài hát này." });
    }

    const data = {};
    for (const key of [
      "title",
      "audio_url",
      "description",
      "genre",
      "composer",
      "singer",
    ]) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }

    if (req.body.release !== undefined) {
      const d = validDate(req.body.release);
      if (!d)
        return res
          .status(400)
          .json({ message: "Ngày phát hành không hợp lệ." });
      data.release = d;
    }

    if (req.body.Albumalbum_id !== undefined) {
      const albumId = validId(req.body.Albumalbum_id);
      if (
        !albumId ||
        !(await prisma.album.findUnique({ where: { album_id: albumId } }))
      ) {
        return res.status(400).json({ message: "Album không hợp lệ." });
      }
      data.Albumalbum_id = albumId;
    }

    const song = await prisma.song.update({ where: { song_id: songId }, data });
    res.json({ song });
  } catch (error) {
    next(error);
  }
});

// Xóa bài hát: chủ sở hữu hoặc admin
router.delete("/songs/:id", requireAuth, async (req, res, next) => {
  try {
    const songId = validId(req.params.id);
    if (!songId) return res.status(400).json({ message: "ID không hợp lệ." });

    const song = await prisma.song.findUnique({ where: { song_id: songId } });
    if (!song)
      return res.status(404).json({ message: "Không tìm thấy bài hát." });

    if (song.Useruser_id !== req.user.user_id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa bài hát này." });
    }

    await prisma.song.delete({ where: { song_id: songId } });
    res.json({ message: "Đã xóa bài hát." });
  } catch (error) {
    next(error);
  }
});

// ================= ALBUMS =================

// Danh sách album
router.get("/albums", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();

    const albums = await prisma.album.findMany({
      where: q ? { title: { contains: q } } : {},
      include: {
        user: { select: { user_id: true, full_name: true } },
        songs: true,
      },
      orderBy: { album_id: "desc" },
      take: 200,
    });

    res.json({ albums });
  } catch (error) {
    next(error);
  }
});

// Tạo album
router.post("/albums", requireAuth, async (req, res, next) => {
  try {
    const { title, release, cover_image_url, description } = req.body;
    const releaseDate = validDate(release || new Date());

    if (!title?.trim() || !releaseDate) {
      return res
        .status(400)
        .json({ message: "Tên album và ngày phát hành là bắt buộc." });
    }

    const album = await prisma.album.create({
      data: {
        title: title.trim(),
        release: releaseDate,
        cover_image_url: cover_image_url || null,
        description: description || null,
        Useruser_id: req.user.user_id,
      },
    });

    res.status(201).json({ album });
  } catch (error) {
    next(error);
  }
});

// Sửa album
router.patch("/albums/:id", requireAuth, async (req, res, next) => {
  try {
    const albumId = validId(req.params.id);
    if (!albumId) return res.status(400).json({ message: "ID không hợp lệ." });

    const old = await prisma.album.findUnique({ where: { album_id: albumId } });
    if (!old) return res.status(404).json({ message: "Không tìm thấy album." });

    if (old.Useruser_id !== req.user.user_id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền sửa album này." });
    }

    const data = {};
    for (const key of ["title", "cover_image_url", "description"]) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }

    if (req.body.release !== undefined) {
      const d = validDate(req.body.release);
      if (!d)
        return res
          .status(400)
          .json({ message: "Ngày phát hành không hợp lệ." });
      data.release = d;
    }

    const album = await prisma.album.update({
      where: { album_id: albumId },
      data,
    });
    res.json({ album });
  } catch (error) {
    next(error);
  }
});

// Xóa album
router.delete("/albums/:id", requireAuth, async (req, res, next) => {
  try {
    const albumId = validId(req.params.id);
    if (!albumId) return res.status(400).json({ message: "ID không hợp lệ." });

    const album = await prisma.album.findUnique({
      where: { album_id: albumId },
    });
    if (!album)
      return res.status(404).json({ message: "Không tìm thấy album." });

    if (album.Useruser_id !== req.user.user_id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa album này." });
    }

    await prisma.album.delete({ where: { album_id: albumId } });
    res.json({ message: "Đã xóa album." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
