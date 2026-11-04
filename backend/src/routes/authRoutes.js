const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../config/prisma");
const { requireAuth } = require("../middleware/auth");
const { sendPasswordResetEmail } = require("../utils/mailer");
const {
  isObject,
  normalizeEmail,
  validatePassword,
  normalizeText,
  parseBirthDate,
} = require("../utils/accountValidation");

const USER_SELECT = {
  user_id: true,
  full_name: true,
  email: true,
  dateOfBirth: true,
  avatar_url: true,
  nickname: true,
  role: true,
  created_at: true,
};

const createToken = (user) =>
  jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

const passwordFingerprint = (passwordHash) =>
  crypto.createHash("sha256").update(passwordHash).digest("hex");

router.post("/register", async (req, res, next) => {
  try {
    if (!isObject(req.body)) {
      return res.status(400).json({ message: "Dữ liệu đăng ký không hợp lệ." });
    }

    const fullName = normalizeText(req.body.full_name, { required: true });
    const email = normalizeEmail(req.body.email);
    const nickname = normalizeText(req.body.nickname, { nullable: true });
    const dob = parseBirthDate(req.body.dateOfBirth, { optional: true });

    if (
      !fullName.valid ||
      !email ||
      !validatePassword(req.body.password) ||
      !nickname.valid ||
      !dob.valid
    ) {
      return res.status(400).json({
        message:
          "Thông tin đăng ký không hợp lệ. Mật khẩu phải từ 8 đến 72 byte.",
      });
    }

    const user = await prisma.user.create({
      data: {
        full_name: fullName.value,
        email,
        password: await bcrypt.hash(req.body.password, 12),
        dateOfBirth: dob.value || new Date("2000-01-01T00:00:00.000Z"),
        avatar_url: "",
        nickname: nickname.value ?? null,
        role: "user",
      },
      select: USER_SELECT,
    });

    return res.status(201).json({ user, token: createToken(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    if (!isObject(req.body)) {
      return res.status(400).json({
        message: "Thông tin đăng nhập không hợp lệ.",
      });
    }

    const email = normalizeEmail(req.body.email);
    const password =
      typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        message: "Email hoặc mật khẩu không hợp lệ.",
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không chính xác.",
      });
    }

    const safeUser = {
      user_id: user.user_id,
      full_name: user.full_name,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      avatar_url: user.avatar_url,
      nickname: user.nickname,
      role: user.role,
      created_at: user.created_at,
    };

    return res.json({ user: safeUser, token: createToken(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
      select: USER_SELECT,
    });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản." });
    }

    return res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Đổi mật khẩu khi đã đăng nhập
router.post("/password/change", requireAuth, async (req, res, next) => {
  try {
    if (!isObject(req.body)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      !currentPassword ||
      !validatePassword(newPassword) ||
      newPassword !== confirmPassword
    ) {
      return res.status(400).json({
        message: "Vui lòng kiểm tra mật khẩu hiện tại và mật khẩu mới.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "Mật khẩu mới phải khác mật khẩu hiện tại.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
    });

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({
        message: "Mật khẩu hiện tại không chính xác.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { password: hashedPassword },
    });

    return res.json({ message: "Đổi mật khẩu thành công." });
  } catch (error) {
    next(error);
  }
});

// Yêu cầu đặt lại mật khẩu
router.post("/password/forgot", async (req, res, next) => {
  try {
    if (!isObject(req.body)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
    }

    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ message: "Email không hợp lệ." });
    }

    const genericMessage =
      "Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu sẽ được gửi đến hộp thư của bạn.";

    const user = await prisma.user.findUnique({ where: { email } });

    // Không tiết lộ email có đăng ký tài khoản hay không
    if (!user) {
      return res.json({ message: genericMessage });
    }

    const resetToken = jwt.sign(
      {
        user_id: user.user_id,
        purpose: "password-reset",
        passwordFingerprint: passwordFingerprint(user.password),
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/?resetToken=${encodeURIComponent(resetToken)}`;

    await sendPasswordResetEmail(user.email, resetUrl);

    return res.json({ message: genericMessage });
  } catch (error) {
    next(error);
  }
});

// Đặt lại mật khẩu bằng token trong email
router.post("/password/reset", async (req, res, next) => {
  try {
    if (!isObject(req.body)) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ." });
    }

    const { resetToken, newPassword, confirmPassword } = req.body;

    if (
      typeof resetToken !== "string" ||
      !resetToken ||
      !validatePassword(newPassword) ||
      newPassword !== confirmPassword
    ) {
      return res.status(400).json({
        message: "Token hoặc thông tin mật khẩu không hợp lệ.",
      });
    }

    let payload;

    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({
        message: "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.",
      });
    }

    if (
      payload.purpose !== "password-reset" ||
      !Number.isSafeInteger(payload.user_id) ||
      typeof payload.passwordFingerprint !== "string"
    ) {
      return res.status(400).json({
        message: "Token đặt lại mật khẩu không hợp lệ.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { user_id: payload.user_id },
    });

    if (
      !user ||
      passwordFingerprint(user.password) !== payload.passwordFingerprint
    ) {
      return res.status(400).json({
        message: "Liên kết đặt lại mật khẩu không còn hiệu lực.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { password: hashedPassword },
    });

    return res.json({
      message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập.",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
