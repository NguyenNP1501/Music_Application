function errorHandler(error, req, res, next) {
  console.error(error);

  if (error.code === "P2002") {
    return res.status(409).json({ message: "Dữ liệu đã tồn tại." });
  }

  if (error.code === "P2003") {
    return res.status(400).json({ message: "Dữ liệu liên kết không hợp lệ." });
  }

  if (error.code === "P2025") {
    return res.status(404).json({ message: "Không tìm thấy dữ liệu." });
  }

  res.status(500).json({
    message: "Lỗi máy chủ.",
    detail: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
}

module.exports = errorHandler;
