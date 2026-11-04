const router = require("express").Router();
const bcrypt = require("bcryptjs");
const prisma = require("../config/prisma");
const { requireAuth, requireAdmin } = require("../middleware/auth");

async function runSerializable(task, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await prisma.$transaction(task, {
        isolationLevel: "Serializable",
      });
    } catch (error) {
      if (error.code !== "P2034" || attempt === retries - 1) {
        throw error;
      }
    }
  }
}

router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const data = {};

    for (const key of ["full_name", "nickname", "avatar_url"]) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }

    if (req.body.dateOfBirth !== undefined) {
      const date = new Date(req.body.dateOfBirth);
      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({ message: "Ngày sinh không hợp lệ." });
      }
      data.dateOfBirth = date;
    }

    if (req.body.password) {
      if (req.body.password.length < 8) {
        return res.status(400).json({ message: "Mật khẩu tối thiểu 8 ký tự." });
      }
      data.password = await bcrypt.hash(req.body.password, 12);
    }

    const user = await prisma.user.update({
      where: { user_id: req.user.user_id },
      data,
      select: {
        user_id: true,
        full_name: true,
        email: true,
        dateOfBirth: true,
        avatar_url: true,
        nickname: true,
        role: true,
        created_at: true,
      },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Danh sách tài khoản, tìm kiếm theo tên/email
router.get(
  "/admin/users",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const q = String(req.query.q || "").trim();

      const users = await prisma.user.findMany({
        where: q
          ? {
              OR: [{ full_name: { contains: q } }, { email: { contains: q } }],
            }
          : {},
        select: {
          user_id: true,
          full_name: true,
          email: true,
          role: true,
          created_at: true,
        },
        orderBy: { created_at: "desc" },
        take: 200,
      });

      res.json({ users });
    } catch (error) {
      next(error);
    }
  },
);

// Thay đổi vai trò
router.patch(
  "/admin/users/:id/role",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const userId = Number(req.params.id);
      const { role } = req.body;

      if (
        !Number.isInteger(userId) ||
        userId <= 0 ||
        !["user", "admin"].includes(role)
      ) {
        return res
          .status(400)
          .json({ message: "ID hoặc vai trò không hợp lệ." });
      }

      if (userId === req.user.user_id && role !== "admin") {
        return res
          .status(409)
          .json({ message: "Không thể tự hạ quyền tài khoản đang đăng nhập." });
      }

      const result = await runSerializable(async (tx) => {
        const target = await tx.user.findUnique({
          where: { user_id: userId },
        });

        if (!target) {
          return { status: 404, message: "Không tìm thấy tài khoản." };
        }

        if (target.role === "admin" && role === "user") {
          const count = await tx.user.count({
            where: { role: "admin" },
          });

          if (count <= 1) {
            return {
              status: 409,
              message: "Không thể hạ quyền admin cuối cùng.",
            };
          }
        }

        await tx.user.update({
          where: { user_id: userId },
          data: { role },
        });

        return { status: 200, message: "Đã cập nhật vai trò tài khoản." };
      });

      return res.status(result.status).json({
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Xóa tài khoản
router.delete(
  "/admin/users/:id",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const userId = Number(req.params.id);

      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({ message: "ID tài khoản không hợp lệ." });
      }

      if (userId === req.user.user_id) {
        return res
          .status(409)
          .json({ message: "Không thể tự xóa tài khoản đang đăng nhập." });
      }

      const result = await runSerializable(async (tx) => {
        const target = await tx.user.findUnique({
          where: { user_id: userId },
        });

        if (!target) {
          return { status: 404, message: "Không tìm thấy tài khoản." };
        }

        if (target.role === "admin") {
          const count = await tx.user.count({
            where: { role: "admin" },
          });

          if (count <= 1) {
            return {
              status: 409,
              message: "Không thể xóa admin cuối cùng.",
            };
          }
        }

        await tx.user.delete({
          where: { user_id: userId },
        });

        return { status: 200, message: "Đã xóa tài khoản." };
      });

      return res.status(result.status).json({
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
