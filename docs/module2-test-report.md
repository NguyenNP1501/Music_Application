# BÁO CÁO KẾT QUẢ KIỂM THỬ MODULE 2: PHÁT NHẠC TRỰC TUYẾN (HTTP STREAMING)

- **Môn học:** Lập trình mạng (LTM)
- **Module:** Module 2 - Phát nhạc trực tuyến từ server (HTTP Range Requests & Streams)
- **Thời gian thực hiện:** Ngày 05/11/2026
- **Môi trường:** Node.js v24.19.0, Express.js v5.3.0, Prisma ORM 7, MySQL 8.0, React 19 + Vite.

---

## 1. Bảng tổng hợp kịch bản kiểm thử (Test Cases)

| STT | Kịch bản kiểm thử | Cách thực hiện | Kết quả mong đợi | Kết quả thực tế | Đánh giá |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **1** | **Phát bình thường (Full Stream & Range 0)** | `curl -i http://localhost:3000/api/songs/1/stream`<br>`curl -i -H "Range: bytes=0-" http://localhost:3000/api/songs/1/stream` | Lệnh 1 trả về `200 OK`, `Accept-Ranges: bytes`.<br>Lệnh 2 trả về `206 Partial Content`, `Content-Range: bytes 0-1048575/8945229`, `Content-Type: audio/mpeg`. | HTTP 200 và HTTP 206 trả về chính xác với kích thước chunk 1MB (1,048,576 bytes). Trình duyệt phát nhạc ngay tức thì. | ✅ **ĐẠT** |
| **2** | **Tua bài hát (Seek to byte offset)** | `curl -i -H "Range: bytes=3500000-" http://localhost:3000/api/songs/1/stream` | Trả về `206 Partial Content`, `Content-Range: bytes 3500000-4548575/8945229`. | Nhận đúng đoạn 1MB từ vị trí byte 3,500,000. Trình duyệt nhảy phát ngay đoạn đó mà không cần tải từ đầu. | ✅ **ĐẠT** |
| **3** | **Lấy suffix bytes (Byte cuối)** | `curl -i -H "Range: bytes=-500" http://localhost:3000/api/songs/1/stream` | Trả về `206 Partial Content`, `Content-Range: bytes 8944729-8945228/8945229`, `Content-Length: 500`. | Trả về đúng 500 bytes cuối cùng của file âm thanh. | ✅ **ĐẠT** |
| **4** | **Phạm vi Range vượt quá file** | `curl -i -H "Range: bytes=99999999-" http://localhost:3000/api/songs/1/stream` | Trả về `416 Range Not Satisfiable`, header `Content-Range: bytes */8945229`. | Server trả về mã lỗi mạng 416 và định dạng Content-Range chuẩn RFC 7233. | ✅ **ĐẠT** |
| **5** | **Bài hát / File không tồn tại** | `curl -i http://localhost:3000/api/songs/9999/stream` (ID không có trong DB) hoặc xóa file mp3 trên đĩa. | Trả về `404 Not Found`, JSON `{ message: "Không tìm thấy bài hát" }`. UI hiển thị ErrorBanner có nút "Thử lại". | Phản hồi đúng 404 JSON, client không bị crash, giao diện hiển thị banner cảnh báo đỏ rõ ràng. | ✅ **ĐẠT** |
| **6** | **Nhiều kết nối nghe đồng thời (Tải cao)** | Dùng công cụ `autocannon` giả lập 20 kết nối đồng thời trong 10 giây:<br>`npx autocannon -c 20 -d 10 -H "Range: bytes=0-" http://localhost:3000/api/songs/1/stream` | Phục vụ mượt mà, không nghẽn Event Loop, RAM server không tăng vọt nhờ Node.js Streams & Backpressure. | Hoàn thành **704 requests** trong 10.7s, tổng dữ liệu stream **717 MB**, thông lượng đạt **79.8 MB/s**, **0 lỗi**. | ✅ **ĐẠT** |
| **7** | **Xử lý ngắt kết nối đột ngột** | Client đóng tab trình duyệt hoặc tắt mạng khi stream đang truyền. | Server bắt sự kiện `res.on('close')`, gọi `stream.destroy()` và ghi log giải phóng tài nguyên. | Server log in ra đầy đủ:<br>`[stream] client đóng kết nối, đã giải phóng stream (bytes 0-1048575)`<br>Không xảy ra rò rỉ bộ nhớ hoặc socket treo. | ✅ **ĐẠT** |
| **8** | **Tự động chuyển bài (Next song on ended)** | Nghe hết bài hát hoặc tua đến giây cuối cùng. | Thẻ `<audio>` kích hoạt sự kiện `ended`, `PlayerContext` tự động chuyển sang bài kế tiếp trong danh sách phát. | Nhạc tự động chuyển sang bài tiếp theo, cập nhật tiêu đề, ca sĩ và tiếp tục phát mượt mà. | ✅ **ĐẠT** |

---

## 2. Nhật ký đo lường hiệu năng mạng (Performance Metrics)

```text
Running 10s test @ http://localhost:3000/api/songs/1/stream
20 concurrent connections

┌─────────┬────────┬────────┬────────┬────────┬───────────┬─────────┬────────┐
│ Stat    │ 2.5%   │ 50%    │ 97.5%  │ 99%    │ Avg       │ Stdev   │ Max    │
├─────────┼────────┼────────┼────────┼────────┼───────────┼─────────┼────────┤
│ Latency │ 280 ms │ 305 ms │ 346 ms │ 355 ms │ 306.98 ms │ 28.6 ms │ 363 ms │
└─────────┴────────┴────────┴────────┴────────┴───────────┴─────────┴────────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬─────────┬───────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg     │ Stdev │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼───────┼─────────┤
│ Req/Sec   │ 76      │ 76      │ 76      │ 76      │ 76      │ 0     │ 76      │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼───────┼─────────┤
│ Bytes/Sec │ 79.8 MB │ 79.8 MB │ 79.8 MB │ 79.8 MB │ 79.7 MB │ 0 B   │ 79.7 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴─────────┴───────┴─────────┘

Tổng kết: 704 requests hoàn tất trong 10.7s, 717 MB dữ liệu đọc thành công, 0 lỗi kết nối.
```

---

## 3. Đối chiếu tiêu chí hoàn thành (Definition of Done)

- [x] Đã thiết lập lưu trữ file mp3 mẫu trong `backend/uploads/songs/` với file `song1.mp3` dung lượng 8.95 MB (> 5MB).
- [x] Model `Song` chuẩn hóa gồm: `id, title, artist, genre, coverUrl, audioFile, durationSec, createdAt`.
- [x] Đã seed 3 bài hát mẫu vào MySQL và nghiệm thu bảng `Song` khớp tên file.
- [x] 6 lệnh curl nghiệm thu đạt chuẩn: `200` (full), `206` (range 0), `206` (range seek), `206` (suffix 500 bytes), `416` (range out of bounds), `404` (not found).
- [x] Bảo mật API: Trường `audioFile` và đường dẫn vật lý ổ đĩa được ẩn hoàn toàn khỏi tất cả response JSON metadata.
- [x] Middleware `streamAuth` được tích hợp sẵn sàng kèm TODO cho Module 1.
- [x] Trình phát nhạc React quản lý bằng `PlayerContext` với một thẻ `<audio>` duy nhất, hỗ trợ Play/Pause, Next/Prev, Seek, Volume, BufferingSpinner, ErrorBanner.
- [x] Cơ chế `SeekBar` tối ưu: chỉ gửi Range Request khi người dùng thả chuột/tay, chống nghẽn đường truyền.
