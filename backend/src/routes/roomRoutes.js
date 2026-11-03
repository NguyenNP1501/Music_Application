const router = require("express").Router();
const prisma = require("../config/prisma");
const { requireAuth } = require("../middleware/auth");

const validId = (v) =>
  Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null;

// Danh sách phòng
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const rooms = await prisma.room.findMany({
      include: {
        creator: { select: { user_id: true, full_name: true } },
        users: {
          include: {
            user: {
              select: { user_id: true, full_name: true, avatar_url: true },
            },
          },
        },
        _count: { select: { users: true, messages: true } },
      },
      orderBy: { created_at: "desc" },
    });

    res.json({ rooms });
  } catch (error) {
    next(error);
  }
});

// Tạo phòng và tự động thêm người tạo làm owner
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const room_name = String(req.body.room_name || "").trim();

    if (!room_name) {
      return res
        .status(400)
        .json({ message: "Tên phòng không được để trống." });
    }

    const room = await prisma.room.create({
      data: {
        room_name,
        created_by: req.user.user_id,
        users: {
          create: {
            Useruser_id: req.user.user_id,
            role: "owner",
          },
        },
      },
      include: { users: true },
    });

    res.status(201).json({ room });
  } catch (error) {
    next(error);
  }
});

// Tham gia phòng
router.post("/:id/join", requireAuth, async (req, res, next) => {
  try {
    const roomId = validId(req.params.id);
    if (!roomId)
      return res.status(400).json({ message: "ID phòng không hợp lệ." });

    const room = await prisma.room.findUnique({ where: { room_id: roomId } });
    if (!room)
      return res.status(404).json({ message: "Không tìm thấy phòng." });

    const member = await prisma.user_Room.upsert({
      where: {
        Useruser_id_Roomroom_id: {
          Useruser_id: req.user.user_id,
          Roomroom_id: roomId,
        },
      },
      create: {
        Useruser_id: req.user.user_id,
        Roomroom_id: roomId,
        role: "member",
      },
      update: {},
    });

    res.json({ member });
  } catch (error) {
    next(error);
  }
});

// Rời phòng
router.delete("/:id/leave", requireAuth, async (req, res, next) => {
  try {
    const roomId = validId(req.params.id);
    if (!roomId)
      return res.status(400).json({ message: "ID phòng không hợp lệ." });

    const room = await prisma.room.findUnique({ where: { room_id: roomId } });
    if (!room)
      return res.status(404).json({ message: "Không tìm thấy phòng." });

    if (room.created_by === req.user.user_id) {
      return res
        .status(409)
        .json({
          message:
            "Chủ phòng không thể rời phòng. Hãy xóa phòng hoặc chuyển quyền quản lý.",
        });
    }

    await prisma.user_Room.delete({
      where: {
        Useruser_id_Roomroom_id: {
          Useruser_id: req.user.user_id,
          Roomroom_id: roomId,
        },
      },
    });

    res.json({ message: "Đã rời phòng." });
  } catch (error) {
    next(error);
  }
});

// Lấy tin nhắn trong phòng
router.get("/:id/messages", requireAuth, async (req, res, next) => {
  try {
    const roomId = validId(req.params.id);
    if (!roomId)
      return res.status(400).json({ message: "ID phòng không hợp lệ." });

    const member = await prisma.user_Room.findUnique({
      where: {
        Useruser_id_Roomroom_id: {
          Useruser_id: req.user.user_id,
          Roomroom_id: roomId,
        },
      },
    });

    if (!member)
      return res.status(403).json({ message: "Bạn chưa tham gia phòng." });

    const messages = await prisma.message.findMany({
      where: { Roomroom_id: roomId },
      include: {
        sender: {
          select: { user_id: true, full_name: true, avatar_url: true },
        },
        receiver: { select: { user_id: true, full_name: true } },
      },
      orderBy: { created_at: "asc" },
      take: 300,
    });

    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

// Gửi tin nhắn
router.post("/:id/messages", requireAuth, async (req, res, next) => {
  try {
    const roomId = validId(req.params.id);
    const content = String(req.body.content || "").trim();

    if (!roomId)
      return res.status(400).json({ message: "ID phòng không hợp lệ." });
    if (!content || content.length > 255) {
      return res
        .status(400)
        .json({ message: "Tin nhắn phải từ 1 đến 255 ký tự." });
    }

    const member = await prisma.user_Room.findUnique({
      where: {
        Useruser_id_Roomroom_id: {
          Useruser_id: req.user.user_id,
          Roomroom_id: roomId,
        },
      },
    });

    if (!member)
      return res.status(403).json({ message: "Bạn chưa tham gia phòng." });

    const message = await prisma.message.create({
      data: {
        content,
        sender_id: req.user.user_id,
        Roomroom_id: roomId,
      },
      include: {
        sender: {
          select: { user_id: true, full_name: true, avatar_url: true },
        },
      },
    });

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
});

// Xóa phòng: chỉ chủ phòng
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const roomId = validId(req.params.id);
    if (!roomId)
      return res.status(400).json({ message: "ID phòng không hợp lệ." });

    const room = await prisma.room.findUnique({ where: { room_id: roomId } });
    if (!room)
      return res.status(404).json({ message: "Không tìm thấy phòng." });

    if (room.created_by !== req.user.user_id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Chỉ chủ phòng hoặc admin mới được xóa phòng." });
    }

    await prisma.room.delete({ where: { room_id: roomId } });
    res.json({ message: "Đã xóa phòng." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
