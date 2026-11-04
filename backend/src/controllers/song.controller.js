const fs = require('fs');
const path = require('path');
const prisma = require('../config/db');

// Thư mục lưu trữ file âm thanh
const SONG_DIR = path.join(__dirname, '../../uploads/songs');

// Kích thước chunk tối đa cho 1 lần stream (1MB = 1048576 bytes)
const CHUNK_SIZE = 1024 * 1024;

/**
 * Suy ra Content-Type dựa trên đuôi mở rộng của file
 */
const getContentType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.mp3':
      return 'audio/mpeg';
    case '.ogg':
      return 'audio/ogg';
    case '.wav':
      return 'audio/wav';
    case '.m4a':
      return 'audio/mp4';
    default:
      return 'audio/mpeg';
  }
};

/**
 * Task 2: Lấy danh sách toàn bộ bài hát
 * Chỉ select các trường metadata công khai, tuyệt đối không trả audioFile
 */
const getAllSongs = async (req, res) => {
  try {
    const songs = await prisma.song.findMany({
      select: {
        id: true,
        title: true,
        artist: true,
        genre: true,
        coverUrl: true,
        durationSec: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    return res.status(200).json(songs);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bài hát:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

/**
 * Task 2: Lấy thông tin chi tiết một bài hát
 * ID không phải số nguyên -> 400
 * Không tìm thấy bài -> 404
 * Không trả audioFile
 */
const getSongById = async (req, res) => {
  try {
    const songId = Number(req.params.id);

    // Validate ID phải là số nguyên dương
    if (!Number.isInteger(songId) || songId <= 0) {
      return res.status(400).json({ message: 'ID bài hát không hợp lệ' });
    }

    const song = await prisma.song.findUnique({
      where: { id: songId },
      select: {
        id: true,
        title: true,
        artist: true,
        genre: true,
        coverUrl: true,
        durationSec: true
      }
    });

    if (!song) {
      return res.status(404).json({ message: 'Không tìm thấy bài hát' });
    }

    return res.status(200).json(song);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết bài hát:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

/**
 * Task 3: Stream file âm thanh theo chuẩn HTTP 206 Partial Content
 */
const streamSong = async (req, res) => {
  try {
    const songId = Number(req.params.id);

    // 1. Validate id
    if (!Number.isInteger(songId) || songId <= 0) {
      return res.status(400).json({ message: 'ID bài hát không hợp lệ' });
    }

    // Tìm bài hát trong DB để lấy tên file audio
    const song = await prisma.song.findUnique({
      where: { id: songId },
      select: { audioFile: true }
    });

    if (!song || !song.audioFile) {
      return res.status(404).json({ message: 'Không tìm thấy bài hát' });
    }

    // 2. Tạo đường dẫn file an toàn (chống path traversal qua path.basename)
    const filePath = path.join(SONG_DIR, path.basename(song.audioFile));

    // 3. Kiểm tra file trên đĩa cứng bằng fs.promises.stat (không dùng statSync để tránh chặn I/O)
    let stat;
    try {
      stat = await fs.promises.stat(filePath);
    } catch (err) {
      return res.status(404).json({ message: 'File âm thanh không tồn tại' });
    }

    const fileSize = stat.size;

    // 4. Xác định Content-Type
    const contentType = getContentType(filePath);

    const rangeHeader = req.headers.range;

    // 5. Nếu không có header Range: trả về toàn bộ file (200 OK)
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
        console.log('[stream] client đóng kết nối, đã giải phóng stream (200)');
      });

      fullStream.on('error', (err) => {
        console.error('[stream error]', err);
        res.destroy();
      });

      return;
    }

    // 6. Có header Range: Phân tích regex hỗ trợ 3 dạng: 'a-b', 'a-', '-n'
    const rangeRegex = /^bytes=(\d*)-(\d*)$/;
    const matches = rangeHeader.match(rangeRegex);

    if (!matches || (matches[1] === '' && matches[2] === '')) {
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      return res.status(416).json({ message: 'Phạm vi Range không hợp lệ' });
    }

    let start;
    let end;

    if (matches[1] === '') {
      // Dạng '-n' (lấy n byte cuối)
      const lastBytes = parseInt(matches[2], 10);
      start = Math.max(0, fileSize - lastBytes);
      end = fileSize - 1;
    } else {
      start = parseInt(matches[1], 10);
      if (matches[2] !== '') {
        // Dạng 'a-b'
        end = parseInt(matches[2], 10);
      } else {
        // Dạng 'a-' (từ a đến hết hoặc lấy 1 chunk 1MB)
        end = Math.min(start + CHUNK_SIZE - 1, fileSize - 1);
      }
    }

    // Nếu end vượt quá kích thước file
    if (end >= fileSize) {
      end = fileSize - 1;
    }

    // 8. Kiểm tra tính hợp lệ: start >= fileSize hoặc start > end -> 416
    if (start >= fileSize || start > end) {
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      return res.status(416).json({ message: 'Phạm vi Range không hợp lệ' });
    }

    const chunkSize = end - start + 1;

    // 9. Trả về mã phản hồi 206 Partial Content cùng các headers mạng chuẩn
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': contentType
    });

    // 10. Tạo ReadStream theo byte range và pipe thẳng vào response
    const stream = fs.createReadStream(filePath, { start, end });
    stream.pipe(res);

    // 11. Bắt sự kiện ngắt kết nối để giải phóng stream ngay lập tức, chống rò rỉ bộ nhớ
    res.on('close', () => {
      stream.destroy();
      console.log(`[stream] client đóng kết nối, đã giải phóng stream (bytes ${start}-${end})`);
    });

    // 12. Bắt lỗi stream để không crash server
    stream.on('error', (streamErr) => {
      console.error('[stream error]', streamErr);
      res.destroy();
    });

  } catch (error) {
    console.error('Lỗi khi xử lý stream:', error);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi stream' });
    }
    res.destroy();
  }
};

module.exports = {
  getAllSongs,
  getSongById,
  streamSong
};
