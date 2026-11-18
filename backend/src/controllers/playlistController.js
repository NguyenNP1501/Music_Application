const prisma = require("../config/prisma");

const validId = (v) =>
  Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null;

const getPlaylists = async (req, res, next) => {
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
    return res.json({ playlists });
  } catch (error) {
    next(error);
  }
};

const createPlaylist = async (req, res, next) => {
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

    return res.status(201).json({ playlist });
  } catch (error) {
    next(error);
  }
};

const updatePlaylist = async (req, res, next) => {
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

    if (req.body.title !== undefined) {
      if (typeof req.body.title !== "string" || !req.body.title.trim()) {
        return res
          .status(400)
          .json({ message: "Tên playlist không được để trống." });
      }
      data.title = req.body.title.trim();
    }

    if (req.body.description !== undefined) {
      if (
        req.body.description !== null &&
        typeof req.body.description !== "string"
      ) {
        return res
          .status(400)
          .json({ message: "Mô tả playlist không hợp lệ." });
      }
      data.description = req.body.description?.trim() || null;
    }

    if (req.body.cover_image_url !== undefined) {
      if (
        req.body.cover_image_url !== null &&
        typeof req.body.cover_image_url !== "string"
      ) {
        return res.status(400).json({ message: "Đường dẫn ảnh không hợp lệ." });
      }
      data.cover_image_url = req.body.cover_image_url || null;
    }

    if (req.body.visibility !== undefined) {
      if (!["public", "private"].includes(req.body.visibility)) {
        return res
          .status(400)
          .json({ message: "visibility phải là public hoặc private." });
      }
      data.visibility = req.body.visibility;
    }

    if (Object.keys(data).length === 0) {
      return res
        .status(400)
        .json({ message: "Không có thông tin nào được thay đổi." });
    }

    data.updated_at = new Date();

    const playlist = await prisma.playlist.update({
      where: { playlist_id: playlistId },
      data,
    });

    return res.json({ message: "Đã cập nhật playlist.", playlist });
  } catch (error) {
    next(error);
  }
};

const deletePlaylist = async (req, res, next) => {
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
    return res.json({ message: "Đã xóa playlist." });
  } catch (error) {
    next(error);
  }
};

const addSongToPlaylist = async (req, res, next) => {
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

    const song = await prisma.song.findUnique({ where: { song_id: songId } });
    if (!song)
      return res.status(404).json({ message: "Không tìm thấy bài hát." });

    try {
      const item = await prisma.playlist_Song.create({
        data: {
          Playlistplaylist_id: playlistId,
          Songsong_id: songId,
        },
      });
      return res.status(201).json({ item });
    } catch (error) {
      if (error.code === "P2002") {
        return res
          .status(409)
          .json({ message: "Bài hát đã tồn tại trong playlist." });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

const removeSongFromPlaylist = async (req, res, next) => {
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

    return res.json({ message: "Đã xóa bài hát khỏi playlist." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
};
