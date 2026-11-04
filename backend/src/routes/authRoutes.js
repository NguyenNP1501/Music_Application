const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { requireAuth } = require("../middleware/auth");
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
          "Thông tin đăng ký không hợp lệ. Họ tên và email là bắt buộc; mật khẩu phải từ 8 đến 72 byte; ngày sinh và tên hiển thị phải đúng định dạng.",
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
      return res
        .status(400)
        .json({ message: "Thông tin đăng nhập không hợp lệ." });
    }

    const email = normalizeEmail(req.body.email);
    const password =
      typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password || Buffer.byteLength(password, "utf8") > 72) {
      return res
        .status(400)
        .json({ message: "Email hoặc mật khẩu không hợp lệ." });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không chính xác." });
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

module.exports = router;
