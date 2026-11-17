const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Bạn cần đăng nhập." });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.NotBeforeError
    ) {
      return res.status(401).json({
        message: "Token không hợp lệ hoặc đã hết hạn.",
      });
    }
    return next(error);
  }

  const userId = Number(payload?.user_id);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(401).json({ message: "Token không hợp lệ." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: { user_id: true, role: true },
    });

    if (!user) {
      return res.status(401).json({
        message: "Tài khoản không còn tồn tại.",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Bạn không có quyền quản trị.",
    });
  }
  return next();
}

module.exports = { requireAuth, requireAdmin };
