const express = require('express');
const cors = require('cors');
const songRoutes = require('./routes/song.routes');

const app = express();

// Middleware CORS cho phép đọc các header mạng then chốt khi stream
app.use(cors({
  origin: '*',
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
}));

// Middleware đọc JSON từ request
app.use(express.json());

// API kiểm tra server
app.get('/', (req, res) => {
  res.send('Express server is running!');
});

// Đăng ký route bài hát Module 2
app.use('/api/songs', songRoutes);

module.exports = app;
