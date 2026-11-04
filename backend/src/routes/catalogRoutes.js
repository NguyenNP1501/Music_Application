const router = require("express").Router();
const prisma = require("../config/prisma");
const { requireAuth } = require("../middleware/auth");
const { getPagination } = require("../utils/catalogValidation");
const fs = require("fs");
const path = require("path");
const { requireAdmin } = require("../middleware/auth");
const { uploadMusic, uploadDir } = require("../middleware/uploadMusic");
const validId = (value) => {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};

const validDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
    ? d
    : null;
};

const validText = (value, required = false) => {
  if (typeof value !== "string") return required ? null : undefined;
  const text = value.trim();
  if ((!text && required) || text.length > 255) return null;
  return text || (required ? null : undefined);
};

const validUrl = (value, required = false) => {
  const text = validText(value, required);
  if (text === null || text === undefined) return text;
  try {
    const url = new URL(text);
    return ["http:", "https:"].includes(url.protocol) ? text : null;
  } catch {
    return null;
  }
};

const canManage = (record, userId, role) =>
  record.Useruser_id === userId || role === "admin";

// ================= SONGS =================

// Admin tải file MP3 từ máy tính lên thư viện
router.post("/songs/upload", requireAuth, requireAdmin, (req, res, next) => {
  uploadMusic.single("audio")(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file)
      return res.status(400).json({ message: "Vui lòng chọn file MP3." });

    try {
      const {
        title,
        singer,
        composer,
        genre,
        description,
        Albumalbum_id,
        release,
      } = req.body;
      const albumId = validId(Albumalbum_id);
      const releaseDate = release ? validDate(release) : new Date();

      if (
        ![title, singer, composer, genre].every((v) => validText(v, true)) ||
        !albumId ||
        !releaseDate ||
        validText(description) === null
      ) {
        throw Object.assign(new Error("Thông tin bài hát không hợp lệ."), {
          status: 400,
        });
      }

      // Kiểm tra chữ ký file MP3, không chỉ dựa vào phần mở rộng.
      const header = Buffer.alloc(3);
      const fd = fs.openSync(req.file.path, "r");
      fs.readSync(fd, header, 0, 3, 0);
      fs.closeSync(fd);
      const isMp3 =
        header.toString("ascii") === "ID3" ||
        (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);

      if (!isMp3) {
        throw Object.assign(
          new Error("File tải lên không phải dữ liệu MP3 hợp lệ."),
          { status: 400 },
        );
      }

      const album = await prisma.album.findUnique({
        where: { album_id: albumId },
      });
      if (!album)
        throw Object.assign(new Error("Album không tồn tại."), { status: 400 });

      const audio_url = `/uploads/music/${req.file.filename}`;

      const song = await prisma.song.create({
        data: {
          title: validText(title, true),
          singer: validText(singer, true),
          composer: validText(composer, true),
          genre: validText(genre, true),
          description: validText(description) ?? null,
          audio_url,
          release: releaseDate,
          Albumalbum_id: albumId,
          Useruser_id: req.user.user_id,
        },
      });

      res.status(201).json({ song });
    } catch (error) {
      fs.unlink(req.file.path, () => {});
      if (error.status)
        return res.status(error.status).json({ message: error.message });
      next(error);
    }
  });
});

// Danh sách bài hát và tìm kiếm
router.get("/songs", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const pagination = getPagination(req.query);

    if (!pagination) {
      return res
        .status(400)
        .json({ message: "Thông tin phân trang không hợp lệ." });
    }

    const where = q
      ? {
          OR: [
            { title: { contains: q } },
            { singer: { contains: q } },
            { composer: { contains: q } },
            { genre: { contains: q } },
          ],
        }
      : {};

    const [songs, total] = await prisma.$transaction([
      prisma.song.findMany({
        where,
        include: {
          album: true,
          user: { select: { user_id: true, full_name: true } },
        },
        orderBy: { song_id: "desc" },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.song.count({ where }),
    ]);

    res.json({
      songs,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    });
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
    const title = validText(req.body.title, true);
    const singer = validText(req.body.singer, true);
    const composer = validText(req.body.composer, true);
    const genre = validText(req.body.genre, true);
    const audio_url = validUrl(req.body.audio_url, true);
    const description = validText(req.body.description);
    const albumId = validId(req.body.Albumalbum_id);
    const releaseDate = req.body.release
      ? validDate(req.body.release)
      : new Date();

    if (
      [title, singer, composer, genre, audio_url].some((v) => v === null) ||
      description === null ||
      !albumId ||
      !releaseDate
    ) {
      return res.status(400).json({ message: "Dữ liệu bài hát không hợp lệ." });
    }

    const album = await prisma.album.findUnique({
      where: { album_id: albumId },
    });
    if (!album)
      return res.status(400).json({ message: "Album không tồn tại." });

    if (!canManage(album, req.user.user_id, req.user.role)) {
      return res.status(403).json({
        message: "Bạn không có quyền thêm bài hát vào album này.",
      });
    }

    const song = await prisma.song.create({
      data: {
        title,
        singer,
        composer,
        genre,
        audio_url,
        description: description ?? null,
        release: releaseDate,
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

    if (!canManage(old, req.user.user_id, req.user.role)) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền sửa bài hát này." });
    }

    const data = {};
    const textFields = ["title", "singer", "composer", "genre", "description"];

    for (const key of textFields) {
      if (req.body[key] !== undefined) {
        const value = validText(req.body[key], key !== "description");
        if (value === null)
          return res
            .status(400)
            .json({ message: `Trường ${key} không hợp lệ.` });
        data[key] = value ?? null;
      }
    }

    if (req.body.audio_url !== undefined) {
      const value = validUrl(req.body.audio_url, true);
      if (!value)
        return res
          .status(400)
          .json({ message: "Đường dẫn audio không hợp lệ." });
      data.audio_url = value;
    }

    if (req.body.release !== undefined) {
      const value = validDate(req.body.release);
      if (!value)
        return res
          .status(400)
          .json({ message: "Ngày phát hành không hợp lệ." });
      data.release = value;
    }

    if (req.body.Albumalbum_id !== undefined) {
      const albumId = validId(req.body.Albumalbum_id);
      if (!albumId) {
        return res.status(400).json({ message: "Album không hợp lệ." });
      }

      const album = await prisma.album.findUnique({
        where: { album_id: albumId },
      });

      if (!album) {
        return res.status(400).json({ message: "Album không tồn tại." });
      }

      if (!canManage(album, req.user.user_id, req.user.role)) {
        return res.status(403).json({
          message: "Bạn không có quyền sử dụng album này.",
        });
      }

      data.Albumalbum_id = albumId;
    }
    if (!Object.keys(data).length) {
      return res
        .status(400)
        .json({ message: "Không có dữ liệu cần cập nhật." });
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
    const pagination = getPagination(req.query);

    if (!pagination) {
      return res
        .status(400)
        .json({ message: "Thông tin phân trang không hợp lệ." });
    }

    const where = q ? { title: { contains: q } } : {};

    const [albums, total] = await prisma.$transaction([
      prisma.album.findMany({
        where,
        include: {
          user: { select: { user_id: true, full_name: true } },
          songs: true,
        },
        orderBy: { album_id: "desc" },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      prisma.album.count({ where }),
    ]);

    res.json({
      albums,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Tạo album
router.post("/albums", requireAuth, async (req, res, next) => {
  try {
    const title = validText(req.body.title, true);
    const description = validText(req.body.description);
    const cover_image_url = validUrl(req.body.cover_image_url);
    const releaseDate = req.body.release
      ? validDate(req.body.release)
      : new Date();

    if (
      !title ||
      description === null ||
      cover_image_url === null ||
      !releaseDate
    ) {
      return res.status(400).json({ message: "Dữ liệu album không hợp lệ." });
    }

    const album = await prisma.album.create({
      data: {
        title,
        release: releaseDate,
        description: description ?? null,
        cover_image_url: cover_image_url ?? null,
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

    if (!canManage(old, req.user.user_id, req.user.role)) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền sửa album này." });
    }

    const data = {};

    if (req.body.title !== undefined) {
      const value = validText(req.body.title, true);
      if (!value)
        return res.status(400).json({ message: "Tên album không hợp lệ." });
      data.title = value;
    }

    if (req.body.description !== undefined) {
      const value = validText(req.body.description);
      if (value === null)
        return res.status(400).json({ message: "Mô tả không hợp lệ." });
      data.description = value ?? null;
    }

    if (req.body.cover_image_url !== undefined) {
      const value = validUrl(req.body.cover_image_url);
      if (value === null)
        return res
          .status(400)
          .json({ message: "Đường dẫn ảnh bìa không hợp lệ." });
      data.cover_image_url = value ?? null;
    }

    if (req.body.release !== undefined) {
      const value = validDate(req.body.release);
      if (!value)
        return res
          .status(400)
          .json({ message: "Ngày phát hành không hợp lệ." });
      data.release = value;
    }

    if (!Object.keys(data).length) {
      return res
        .status(400)
        .json({ message: "Không có dữ liệu cần cập nhật." });
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
      include: { _count: { select: { songs: true } } },
    });

    if (!album)
      return res.status(404).json({ message: "Không tìm thấy album." });

    if (!canManage(album, req.user.user_id, req.user.role)) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa album này." });
    }

    if (album._count.songs > 0) {
      return res.status(409).json({
        message: `Không thể xóa album vì vẫn còn ${album._count.songs} bài hát. Hãy chuyển hoặc xóa các bài hát trước.`,
      });
    }

    await prisma.album.delete({ where: { album_id: albumId } });
    res.json({ message: "Đã xóa album." });
  } catch (error) {
    next(error);
  }
});

// ============= ARTISTS ============

router.get("/artists", async (req, res, next) => {
  try {
    if (req.query.q !== undefined && typeof req.query.q !== "string") {
      return res.status(400).json({
        message: "Từ khóa tìm kiếm không hợp lệ.",
      });
    }

    const q = (req.query.q || "").trim();

    if (q.length > 255) {
      return res.status(400).json({
        message: "Từ khóa tìm kiếm quá dài.",
      });
    }

    const pagination = getPagination(req.query);

    if (!pagination) {
      return res.status(400).json({
        message: "Thông tin phân trang không hợp lệ.",
      });
    }

    const where = q ? { singer: { contains: q } } : {};

    const [artists, countRows] = await prisma.$transaction([
      prisma.song.groupBy({
        by: ["singer"],
        where,
        _count: { _all: true },
        orderBy: { singer: "asc" },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      q
        ? prisma.$queryRaw`
            SELECT COUNT(DISTINCT singer) AS total
            FROM Song
            WHERE singer LIKE ${`%${q}%`}
          `
        : prisma.$queryRaw`
            SELECT COUNT(DISTINCT singer) AS total
            FROM Song
          `,
    ]);

    const total = Number(countRows[0]?.total || 0);

    res.json({
      artists: artists.map((item) => ({
        name: item.singer,
        songCount: item._count._all,
      })),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
