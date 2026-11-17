const router = require("express").Router();
const prisma = require("../config/prisma");
const { requireAuth } = require("../middleware/auth");

const validId = (v) =>
  Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null;

// Theo dõi người dùng
router.post("/users/:id/follow", requireAuth, async (req, res, next) => {
  try {
    const targetId = validId(req.params.id);

    if (!targetId || targetId === req.user.user_id) {
      return res
        .status(400)
        .json({ message: "Không thể theo dõi tài khoản này." });
    }

    const target = await prisma.user.findUnique({
      where: { user_id: targetId },
    });

    if (!target)
      return res.status(404).json({ message: "Không tìm thấy người dùng." });

    const follow = await prisma.follow.create({
      data: {
        follower_id: req.user.user_id,
        following_id: targetId,
      },
    });

    res.status(201).json({ follow });
  } catch (error) {
    next(error);
  }
});

// Bỏ theo dõi
router.delete("/users/:id/follow", requireAuth, async (req, res, next) => {
  try {
    const targetId = validId(req.params.id);
    if (!targetId) return res.status(400).json({ message: "ID không hợp lệ." });

    await prisma.follow.delete({
      where: {
        follower_id_following_id: {
          follower_id: req.user.user_id,
          following_id: targetId,
        },
      },
    });

    res.json({ message: "Đã bỏ theo dõi." });
  } catch (error) {
    next(error);
  }
});

// Danh sách người đang theo dõi
router.get("/users/me/following", requireAuth, async (req, res, next) => {
  try {
    const followings = await prisma.follow.findMany({
      where: { follower_id: req.user.user_id },
      include: {
        following: {
          select: {
            user_id: true,
            full_name: true,
            nickname: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    res.json({ followings });
  } catch (error) {
    next(error);
  }
});

// Danh sách người theo dõi mình
router.get("/users/me/followers", requireAuth, async (req, res, next) => {
  try {
    const followers = await prisma.follow.findMany({
      where: { following_id: req.user.user_id },
      include: {
        follower: {
          select: {
            user_id: true,
            full_name: true,
            nickname: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    res.json({ followers });
  } catch (error) {
    next(error);
  }
});

// Xem thông báo
router.get("/notifications", requireAuth, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { Useruser_id: req.user.user_id },
      include: { album: true, song: true },
      orderBy: { created_at: "desc" },
      take: 100,
    });

    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

// Đánh dấu thông báo đã đọc
router.patch("/notifications/:id/read", requireAuth, async (req, res, next) => {
  try {
    const notificationId = validId(req.params.id);
    if (!notificationId)
      return res.status(400).json({ message: "ID không hợp lệ." });

    const notification = await prisma.notification.findUnique({
      where: { notification_id: notificationId },
    });

    if (!notification)
      return res.status(404).json({ message: "Không tìm thấy thông báo." });

    if (notification.Useruser_id !== req.user.user_id) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền cập nhật thông báo này." });
    }

    const updated = await prisma.notification.update({
      where: { notification_id: notificationId },
      data: { is_read: true },
    });

    res.json({ notification: updated });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
