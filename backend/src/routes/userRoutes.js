const router = require("express").Router();
const prisma = require("../config/prisma");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const {
  isObject,
  normalizeText,
  normalizeAvatarUrl,
  parseBirthDate,
} = require("../utils/accountValidation");

async function runSerializable(task, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await prisma.$transaction(task, {
        isolationLevel: "Serializable",
      });
    } catch (error) {
      if (error.code !== "P2034" || attempt === retries - 1) throw error;
    }
  }
}

router.patch("/me", requireAuth, async (req, res, next) => {
  try {
    if (!isObject(req.body)) {
      return res
        .status(400)
        .json({ message: "Dữ liệu cập nhật không hợp lệ." });
    }

    const allowed = new Set([
      "full_name",
      "nickname",
      "avatar_url",
      "dateOfBirth",
    ]);

    if (Object.keys(req.body).some((key) => !allowed.has(key))) {
      return res
        .status(400)
        .json({ message: "Có trường thông tin không được phép cập nhật." });
    }

    if (!Object.keys(req.body).length) {
      return res
        .status(400)
        .json({ message: "Không có thông tin cần cập nhật." });
    }

    const data = {};

    if (req.body.full_name !== undefined) {
      const value = normalizeText(req.body.full_name, { required: true });
      if (!value.valid) {
        return res
          .status(400)
          .json({ message: "Họ và tên phải có từ 1 đến 255 ký tự." });
      }
      data.full_name = value.value;
    }

    if (req.body.nickname !== undefined) {
      const value = normalizeText(req.body.nickname, { nullable: true });
      if (!value.valid) {
        return res
          .status(400)
          .json({ message: "Tên hiển thị không hợp lệ (tối đa 255 ký tự)." });
      }
      data.nickname = value.value;
    }

    if (req.body.avatar_url !== undefined) {
      const value = normalizeAvatarUrl(req.body.avatar_url);
      if (!value.valid) {
        return res.status(400).json({
          message:
            "Đường dẫn ảnh đại diện phải là URL HTTP/HTTPS hợp lệ và không quá 255 ký tự.",
        });
      }
      data.avatar_url = value.value;
    }

    if (req.body.dateOfBirth !== undefined) {
      const value = parseBirthDate(req.body.dateOfBirth);
      if (!value.valid) {
        return res.status(400).json({
          message: "Ngày sinh không hợp lệ hoặc nằm trong tương lai.",
        });
      }
      data.dateOfBirth = value.value;
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

    return res.json({ user });
  } catch (error) {
    next(error);
  }
});

router.get(
  "/admin/users",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      if (req.query.q !== undefined && typeof req.query.q !== "string") {
        return res
          .status(400)
          .json({ message: "Từ khóa tìm kiếm không hợp lệ." });
      }

      const q = (req.query.q || "").trim();

      if (q.length > 255) {
        return res.status(400).json({ message: "Từ khóa tìm kiếm quá dài." });
      }

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

      return res.json({ users });
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/admin/users/:id/role",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const userId = Number(req.params.id);
      const role = req.body?.role;

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
        const target = await tx.user.findUnique({ where: { user_id: userId } });

        if (!target) {
          return { status: 404, message: "Không tìm thấy tài khoản." };
        }

        if (
          target.role === "admin" &&
          role === "user" &&
          (await tx.user.count({ where: { role: "admin" } })) <= 1
        ) {
          return {
            status: 409,
            message: "Không thể hạ quyền admin cuối cùng.",
          };
        }

        await tx.user.update({ where: { user_id: userId }, data: { role } });

        return { status: 200, message: "Đã cập nhật vai trò tài khoản." };
      });

      return res.status(result.status).json({ message: result.message });
    } catch (error) {
      next(error);
    }
  },
);

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
        const target = await tx.user.findUnique({ where: { user_id: userId } });

        if (!target) {
          return { status: 404, message: "Không tìm thấy tài khoản." };
        }

        if (
          target.role === "admin" &&
          (await tx.user.count({ where: { role: "admin" } })) <= 1
        ) {
          return { status: 409, message: "Không thể xóa admin cuối cùng." };
        }

        await tx.user.delete({ where: { user_id: userId } });

        return { status: 200, message: "Đã xóa tài khoản." };
      });

      return res.status(result.status).json({ message: result.message });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
