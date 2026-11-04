/**
 * Middleware xác thực stream bài hát (Module 2).
 * Hiện tại endpoint stream là public, middleware này tạm thời pass qua.
 * TODO: Sau này tích hợp xác thực từ Module 1 (qua query token hoặc httpOnly cookie).
 */
const streamAuth = (req, res, next) => {
  // TODO (Module 1): Kiểm tra token xác thực người dùng nếu có yêu cầu
  // const token = req.headers.authorization?.split(' ')[1] || req.query.token;
  // if (!token) return res.status(401).json({ message: 'Yêu cầu đăng nhập để nghe nhạc' });
  next();
};

module.exports = streamAuth;
