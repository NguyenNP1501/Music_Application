require('dotenv').config();
const { PrismaClient } = require('../src/generated/prisma');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Bắt đầu cập nhật dữ liệu bài hát vào MySQL ---');

  // Xóa danh sách cũ để cập nhật danh sách mới nhất
  await prisma.song.deleteMany({});

  const songsData = [
    {
      title: 'Hãy Trao Cho Anh',
      artist: 'Sơn Tùng M-TP ft. Snoop Dogg',
      genre: 'Latin Pop / Dance',
      coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
      audioFile: 'ST_HTCA.mp3',
      durationSec: 245
    },
    {
      title: 'Cơn Mưa Ngang Qua',
      artist: 'Sơn Tùng M-TP',
      genre: 'R&B / Pop',
      coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop',
      audioFile: 'ST_Con_Mua_Ngang_Qua.mp3',
      durationSec: 237
    },
    {
      title: 'Lưu Niên',
      artist: 'J97',
      genre: 'V-Pop',
      coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
      audioFile: 'J97_Luu_Nien.mp3',
      durationSec: 201
    },
    {
      title: 'Xương Rồng',
      artist: 'Drt',
      genre: 'Rap / V-Pop',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
      audioFile: 'Drt_Xuong_Rong.mp3',
      durationSec: 264
    },
    {
      title: 'SoundHelix Song 1 (Test File > 5MB)',
      artist: 'T. Schürger',
      genre: 'Electronic',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
      audioFile: 'song1.mp3',
      durationSec: 372
    },
    {
      title: 'Melodic Waves',
      artist: 'FreeMusic Archive',
      genre: 'Pop / Ambient',
      coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop',
      audioFile: 'song2.mp3',
      durationSec: 163
    },
    {
      title: 'Acoustic Breeze',
      artist: 'Benjamin Tissot',
      genre: 'Acoustic',
      coverUrl: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&h=300&fit=crop',
      audioFile: 'song3.mp3',
      durationSec: 104
    }
  ];

  for (const song of songsData) {
    const created = await prisma.song.create({
      data: song
    });
    console.log(`Đã thêm vào CSDL: [ID ${created.id}] ${created.title} -> file: ${created.audioFile}`);
  }

  console.log('--- Cập nhật CSDL hoàn tất thành công! ---');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
