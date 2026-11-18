const prisma = require("../config/prisma");
const { getPagination } = require("../utils/catalogValidation");
const cloudinary = require("../config/cloudinary");

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

const isMp3Buffer = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 3) {
    return false;
  }

  const hasId3Header = buffer.subarray(0, 3).toString("ascii") === "ID3";

  const hasMpegFrameHeader =
    buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;

  return hasId3Header || hasMpegFrameHeader;
};

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "music_application/songs",
        resource_type: "video",
        format: "mp3",
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    stream.end(buffer);
  });
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "video",
    invalidate: true,
  });

  if (!["ok", "not found"].includes(result.result)) {
    throw new Error(
      `Cloudinary không xác nhận xóa tài nguyên: ${result.result}`,
    );
  }
};

// ================= SONGS =================

const uploadSong = async (req, res, next) => {
  if (!req.file?.buffer) {
    return res.status(400).json({
      message: "Vui lòng chọn file MP3.",
    });
  }

  let uploadedFile = null;
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
      return res
        .status(400)
        .json({ message: "Thông tin bài hát không hợp lệ." });
    }
    if (!isMp3Buffer(req.file.buffer)) {
      return res.status(400).json({
        message: "Nội dung file không phải MP3 hợp lệ.",
      });
    }

    const album = await prisma.album.findUnique({
      where: { album_id: albumId },
    });
    if (!album) {
      return res.status(400).json({ message: "Album không tồn tại." });
    }
    if (!canManage(album, req.user.user_id, req.user.role)) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền thêm bài hát vào album này." });
    }

    uploadedFile = await uploadToCloudinary(req.file.buffer);
    if (!uploadedFile?.secure_url || !uploadedFile?.public_id) {
      throw new Error("Cloudinary không trả về thông tin file hợp lệ.");
    }

    const song = await prisma.song.create({
      data: {
        title: validText(title, true),
        singer: validText(singer, true),
        composer: validText(composer, true),
        genre: validText(genre, true),
        description: validText(description) ?? null,
        audio_url: uploadedFile.secure_url,
        audio_public_id: uploadedFile.public_id,
        release: releaseDate,
        Albumalbum_id: albumId,
        Useruser_id: req.user.user_id,
      },
    });

    return res
      .status(201)
      .json({ message: "Upload bài hát thành công.", song });
  } catch (error) {
    if (uploadedFile?.public_id) {
      try {
        await deleteFromCloudinary(uploadedFile.public_id);
      } catch (cleanupError) {
        console.error(
          "Không thể dọn file Cloudinary sau lỗi:",
          cleanupError.message,
        );
      }
    }
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    next(error);
  }
};

const getSongs = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const pagination = getPagination(req.query);
    if (!pagination)
      return res
        .status(400)
        .json({ message: "Thông tin phân trang không hợp lệ." });

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

    return res.json({
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
};

const getSongById = async (req, res, next) => {
  try {
    const songId = validId(req.params.id);
    if (!songId) return res.status(400).json({ message: "ID không hợp lệ." });

    const song = await prisma.song.findUnique({
      where: { song_id: songId },
      include: { album: true },
    });

    if (!song)
      return res.status(404).json({ message: "Không tìm thấy bài hát." });
    return res.json({ song });
  } catch (error) {
    next(error);
  }
};

const createSong = async (req, res) => {
  return res.status(410).json({
    message:
      "API này không còn được sử dụng. Vui lòng upload MP3 qua /songs/upload.",
  });
};

const updateSong = async (req, res, next) => {
  let uploadedFile = null;

  try {
    const songId = validId(req.params.id);
    if (!songId) {
      return res.status(400).json({ message: "ID không hợp lệ." });
    }

    const old = await prisma.song.findUnique({
      where: { song_id: songId },
    });
    if (!old) {
      return res.status(404).json({ message: "Không tìm thấy bài hát." });
    }

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
        if (value === null) {
          return res
            .status(400)
            .json({ message: `Trường ${key} không hợp lệ.` });
        }
        data[key] = value ?? null;
      }
    }

    if (req.body.release !== undefined) {
      const value = validDate(req.body.release);
      if (!value) {
        return res
          .status(400)
          .json({ message: "Ngày phát hành không hợp lệ." });
      }
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
        return res
          .status(403)
          .json({ message: "Bạn không có quyền sử dụng album này." });
      }
      data.Albumalbum_id = albumId;
    }

    // Nếu người dùng chọn file MP3 mới
    if (req.file) {
      if (!isMp3Buffer(req.file.buffer)) {
        return res
          .status(400)
          .json({ message: "Nội dung file không phải MP3 hợp lệ." });
      }

      uploadedFile = await uploadToCloudinary(req.file.buffer);
      if (!uploadedFile?.secure_url || !uploadedFile?.public_id) {
        throw new Error("Cloudinary không trả về thông tin file hợp lệ.");
      }
      data.audio_url = uploadedFile.secure_url;
      data.audio_public_id = uploadedFile.public_id;
    }

    if (!Object.keys(data).length) {
      return res
        .status(400)
        .json({ message: "Không có dữ liệu cần cập nhật." });
    }

    // Cập nhật Database trước khi xóa file cũ
    const song = await prisma.song.update({
      where: { song_id: songId },
      data,
    });

    // Chỉ xóa file cũ sau khi Database cập nhật thành công
    if (
      uploadedFile &&
      old.audio_public_id &&
      old.audio_public_id !== uploadedFile.public_id
    ) {
      try {
        await deleteFromCloudinary(old.audio_public_id);
      } catch (cleanupError) {
        console.error("Không thể xóa file nhạc cũ:", cleanupError.message);

        return res.json({
          message:
            "Đã cập nhật bài hát nhưng file nhạc cũ chưa được xóa khỏi Cloudinary.",
          cleanup_pending: true,
          song,
        });
      }
    }

    return res.json({
      message: "Cập nhật bài hát thành công.",
      song,
    });
  } catch (error) {
    // Nếu upload file mới thành công nhưng cập nhật DB thất bại
    if (uploadedFile?.public_id) {
      try {
        await deleteFromCloudinary(uploadedFile.public_id);
      } catch (cleanupError) {
        console.error(
          "Không thể dọn file Cloudinary mới:",
          cleanupError.message,
        );
      }
    }

    next(error);
  }
};

const deleteSong = async (req, res, next) => {
  try {
    const songId = validId(req.params.id);
    if (!songId) {
      return res.status(400).json({ message: "ID không hợp lệ." });
    }

    const song = await prisma.song.findUnique({ where: { song_id: songId } });
    if (!song) {
      return res.status(404).json({ message: "Không tìm thấy bài hát." });
    }

    if (!canManage(song, req.user.user_id, req.user.role)) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xóa bài hát này." });
    }

    // Xóa bản ghi trước để đảm bảo bài hát không còn xuất hiện trong hệ thống nếu việc xóa file Cloudinary gặp lỗi.
    await prisma.song.delete({ where: { song_id: songId } });

    if (song.audio_public_id) {
      try {
        await deleteFromCloudinary(song.audio_public_id);
      } catch (cleanupError) {
        console.error("Không thể xóa file Cloudinary:", cleanupError.message);

        return res.json({
          message:
            "Đã xóa bài hát khỏi hệ thống nhưng file Cloudinary cần được dọn dẹp.",
          cleanup_pending: true,
        });
      }
    }
    return res.json({ message: "Đã xóa bài hát và file lưu trữ." });
  } catch (error) {
    next(error);
  }
};

// ================= ALBUMS =================

const getAlbums = async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    const pagination = getPagination(req.query);
    if (!pagination)
      return res
        .status(400)
        .json({ message: "Thông tin phân trang không hợp lệ." });

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

    return res.json({
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
};

const createAlbum = async (req, res, next) => {
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

    return res.status(201).json({ album });
  } catch (error) {
    next(error);
  }
};

const updateAlbum = async (req, res, next) => {
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

    if (!Object.keys(data).length)
      return res
        .status(400)
        .json({ message: "Không có dữ liệu cần cập nhật." });

    const album = await prisma.album.update({
      where: { album_id: albumId },
      data,
    });
    return res.json({ album });
  } catch (error) {
    next(error);
  }
};

const deleteAlbum = async (req, res, next) => {
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
    return res.json({ message: "Đã xóa album." });
  } catch (error) {
    next(error);
  }
};

// ================= ARTISTS =================

const getArtists = async (req, res, next) => {
  try {
    if (req.query.q !== undefined && typeof req.query.q !== "string") {
      return res
        .status(400)
        .json({ message: "Từ khóa tìm kiếm không hợp lệ." });
    }

    const q = (req.query.q || "").trim();
    if (q.length > 255)
      return res.status(400).json({ message: "Từ khóa tìm kiếm quá dài." });

    const pagination = getPagination(req.query);
    if (!pagination)
      return res
        .status(400)
        .json({ message: "Thông tin phân trang không hợp lệ." });

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
        ? prisma.$queryRaw`SELECT COUNT(DISTINCT singer) AS total FROM Song WHERE singer LIKE ${`%${q}%`}`
        : prisma.$queryRaw`SELECT COUNT(DISTINCT singer) AS total FROM Song`,
    ]);

    const total = Number(countRows[0]?.total || 0);
    return res.json({
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
};

module.exports = {
  uploadSong,
  getSongs,
  getSongById,
  createSong,
  updateSong,
  deleteSong,
  getAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  getArtists,
};
