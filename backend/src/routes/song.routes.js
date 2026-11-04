const express = require('express');
const router = express.Router();
const songController = require('../controllers/song.controller');
const streamAuth = require('../middlewares/streamAuth');

// Task 2: Metadata APIs
router.get('/', songController.getAllSongs);
router.get('/:id', songController.getSongById);

// Task 3: Audio Streaming endpoint với HTTP 206 Partial Content
router.get('/:id/stream', streamAuth, songController.streamSong);

module.exports = router;
