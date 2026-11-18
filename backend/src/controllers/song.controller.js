const fs = require('fs');
const path = require('path');
const prisma = require('../config/prisma');
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

const CHUNK_SIZE = 1024 * 1024;

const streamSong = async (req, res) => {
  try {
    const songId = Number(req.params.id);

    if (!Number.isInteger(songId) || songId <= 0) {
      return res.status(400).json({ message: 'ID bài hát không hợp lệ' });
    }

    const song = await prisma.song.findUnique({
      where: { song_id: songId },
      select: { audio_url: true }
    });

    if (!song || !song.audio_url) {
      return res.status(404).json({ message: 'Không tìm thấy bài hát' });
    }

    let audioUrl;
    try {
      audioUrl = new URL(song.audio_url, 'http://localhost');
    } catch {
      return res.status(404).json({ message: 'File âm thanh không tồn tại' });
    }

    const localAudio = audioUrl.pathname.match(
      /^\/uploads\/(music|songs)\/([^/]+)$/,
    );
    if (audioUrl.origin === 'http://localhost' && localAudio) {
      const filePath = path.join(
        UPLOAD_DIR,
        localAudio[1],
        path.basename(localAudio[2]),
      );
      return await streamFile(req, res, filePath);
    }

    const legacyFileName = path.basename(song.audio_url);
    if (
      audioUrl.origin === 'http://localhost' &&
      song.audio_url === legacyFileName &&
      path.extname(legacyFileName).toLowerCase() === '.mp3'
    ) {
      const filePath = path.join(UPLOAD_DIR, 'songs', legacyFileName);
      return await streamFile(req, res, filePath);
    }

    if (audioUrl.origin !== 'http://localhost') {
      return res.redirect(song.audio_url);
    }

    return res.status(404).json({ message: 'File âm thanh không tồn tại' });
  } catch (error) {
    console.error('Lỗi khi xử lý stream:', error);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi stream' });
    }
    res.destroy();
  }
};

const streamFile = async (req, res, filePath) => {
  const contentType =
    path.extname(filePath).toLowerCase() === '.mp3'
      ? 'audio/mpeg'
      : 'application/octet-stream';
  let stat;
  try {
    stat = await fs.promises.stat(filePath);
  } catch {
    return res.status(404).json({ message: 'File âm thanh không tồn tại' });
  }

  const fileSize = stat.size;
  const rangeHeader = req.headers.range;

  if (!rangeHeader) {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes'
    });

    const fullStream = fs.createReadStream(filePath);
    fullStream.pipe(res);

    res.on('close', () => {
      fullStream.destroy();
    });

    fullStream.on('error', (err) => {
      console.error('[stream error]', err);
      res.destroy();
    });

    return;
  }

  const rangeRegex = /^bytes=(\d*)-(\d*)$/;
  const matches = rangeHeader.match(rangeRegex);

  if (!matches || (matches[1] === '' && matches[2] === '')) {
    res.setHeader('Content-Range', `bytes */${fileSize}`);
    return res.status(416).json({ message: 'Phạm vi Range không hợp lệ' });
  }

  let start;
  let end;

  if (matches[1] === '') {
    const lastBytes = parseInt(matches[2], 10);
    start = Math.max(0, fileSize - lastBytes);
    end = fileSize - 1;
  } else {
    start = parseInt(matches[1], 10);
    if (matches[2] !== '') {
      end = parseInt(matches[2], 10);
    } else {
      end = Math.min(start + CHUNK_SIZE - 1, fileSize - 1);
    }
  }

  if (end >= fileSize) {
    end = fileSize - 1;
  }

  if (start >= fileSize || start > end) {
    res.setHeader('Content-Range', `bytes */${fileSize}`);
    return res.status(416).json({ message: 'Phạm vi Range không hợp lệ' });
  }

  const chunkSize = end - start + 1;

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunkSize,
    'Content-Type': contentType
  });

  const stream = fs.createReadStream(filePath, { start, end });
  stream.pipe(res);

  res.on('close', () => {
    stream.destroy();
  });

  stream.on('error', (streamErr) => {
    console.error('[stream error]', streamErr);
    res.destroy();
  });
};

module.exports = {
  streamSong
};

