const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { requireAuth } = require("../middleware/auth");

const createToken = (user) =>
  jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

router.post("/register", async (req, res, next) => {
  try {
    const { full_name, email, password, dateOfBirth, nickname } = req.body;

    if (
      !full_name?.trim() ||
      !email?.trim() ||
      !password ||
      password.length < 8
    ) {
      return res.status(400).json({
        message: "Vui lòng nhập họ tên, email và mật khẩu tối thiểu 8 ký tự.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const dob = dateOfBirth ? new Date(dateOfBirth) : new Date("2000-01-01");

    if (Number.isNaN(dob.getTime())) {
      return res.status(400).json({ message: "Ngày sinh không hợp lệ." });
    }

    const exists = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (exists) {
      return res.status(409).json({ message: "Email đã được sử dụng." });
    }

    const user = await prisma.user.create({
      data: {
        full_name: full_name.trim(),
        email: normalizedEmail,
        password: await bcrypt.hash(password, 12),
        dateOfBirth: dob,
        avatar_url: "",
        nickname: nickname?.trim() || null,
        role: "user",
      },
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

    res.status(201).json({ user, token: createToken(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ message: "Email hoặc mật khẩu không chính xác." });
    }

    const { password: hiddenPassword, ...safeUser } = user;
    res.json({ user: safeUser, token: createToken(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user.user_id },
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

module.exports = router;
