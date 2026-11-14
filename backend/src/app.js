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

// Các endpoint bổ trợ giúp các trang giao diện khác của nhóm không bị lỗi 404
app.get('/api/albums', (req, res) => res.json({ albums: [] }));
app.get('/api/artists', (req, res) => res.json({ artists: [] }));
app.get('/api/playlists', (req, res) => res.json({ playlists: [] }));
app.get('/api/rooms', (req, res) => res.json({ rooms: [] }));
app.get('/api/notifications', (req, res) => res.json({ notifications: [] }));
app.get('/api/auth/me', (req, res) => res.status(401).json({ message: 'Chưa đăng nhập' }));


module.exports = app;

