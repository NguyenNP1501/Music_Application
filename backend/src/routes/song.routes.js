const router = require('express').Router();
const songController = require('../controllers/song.controller');
const streamAuth = require('../middlewares/streamAuth');

router.get('/:id/stream', streamAuth, songController.streamSong);

module.exports = router;

