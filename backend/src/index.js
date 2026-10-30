const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware đọc JSON từ request
app.use(express.json());

// API kiểm tra server
app.get('/', (req, res) => {
  res.send('Express server is running!');
});

// Khởi chạy server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
