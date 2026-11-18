require("dotenv").config();

const { PrismaClient } = require("../src/generated/prisma");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Bắt đầu kiểm tra dữ liệu mẫu...");

  // Không xóa dữ liệu hiện có.
  // Seed chỉ tạo dữ liệu khi chưa có bản ghi phù hợp.

  const admin = await prisma.user.findFirst({
    orderBy: { user_id: "asc" },
  });

  if (!admin) {
    console.log(
      "Chưa có tài khoản người dùng. Hãy đăng ký tài khoản trước khi seed.",
    );
    return;
  }

  const existingAlbum = await prisma.album.findFirst({
    where: {
      title: "Album mẫu",
      Useruser_id: admin.user_id,
    },
  });

  let album = existingAlbum;

  if (!album) {
    album = await prisma.album.create({
      data: {
        title: "Album mẫu",
        release: new Date(),
        description: "Album dữ liệu mẫu",
        Useruser_id: admin.user_id,
      },
    });

    console.log("Đã tạo album mẫu:", album.album_id);
  }

  console.log("Kiểm tra dữ liệu hoàn tất.");
  console.log("Album mẫu:", album.title);
}

main()
  .catch((error) => {
    console.error("Lỗi khi seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
