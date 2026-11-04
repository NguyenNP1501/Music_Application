require('dotenv').config();
const { PrismaClient } = require('../src/generated/prisma');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Bắt đầu seed dữ liệu mẫu ---');

  // Xóa dữ liệu bài hát cũ nếu có
  await prisma.song.deleteMany({});

  const songsData = [
    {
      title: 'SoundHelix Song 1',
      artist: 'T. Schürger',
      genre: 'Electronic',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
      audioFile: 'song1.mp3',
      durationSec: 372
    },
    {
      title: 'Melodic Waves',
      artist: 'FreeMusic Archive',
      genre: 'Pop / Ambient',
      coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
      audioFile: 'song2.mp3',
      durationSec: 163
    },
    {
      title: 'Acoustic Breeze',
      artist: 'Benjamin Tissot',
      genre: 'Acoustic',
      coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop',
      audioFile: 'song3.mp3',
      durationSec: 104
    }
  ];

  for (const song of songsData) {
    const created = await prisma.song.create({
      data: song
    });
    console.log(`Đã tạo bài hát: [ID ${created.id}] ${created.title} (${created.audioFile})`);
  }

  console.log('--- Seed dữ liệu mẫu hoàn tất! ---');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
