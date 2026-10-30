# Music_Application

// Cài đặt môi trường: npm install
// Tạo csdl qua Prisma + MySQL
- Tạo csdl trong MySQL
- Tạo file .env setup đường dẫn: DATABASE_URL="mysql://root:MẬT_KHẨU_CSDL@localhost:3306/TÊN_CSDL"
- Các bảng được tạo nằm ở file schema.prisma. Nếu chưa cài đặt prisma 7 thì chạy các câu lệnh sau theo thứ tự lần lượt:
npm install -D prisma@7
npm install @prisma/client@7
npm install @prisma/adapter-mariadb mariadb
- Chạy lệnh kiểm tra: npx prisma validate // Nếu Terminal báo "The schema is valid" thì chạy lệnh tiếp theo.
- npx prisma migrate dev --name init // "init" là tên mặc định, sau này có chỉnh sửa gì thì thay bằng tên hành động.
- npx prisma generate
- Mở csdl đã tạo trước đó ở MySQL. Reload lại csdl sẽ thấy các bảng đã được tạo

---CÓ VẤN ĐỀ Ở CHỖ NÀO HỎI CHATGPT---
