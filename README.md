# Core Chat Project (Intern Edition) 🚀

Dự án này là phiên bản rút gọn của hệ thống Chat Real-time, được thiết kế đặc biệt để giúp các bạn nhanh chóng nắm bắt kiến trúc **Node.js + Socket.io + Sequelize**.

---

## 1. KIẾN TRÚC HỆ THỐNG (ARCHITECTURE)

Dự án sử dụng mô hình **MVC + Service Layer**:

- **Controller:** Tiếp nhận Request, gọi Service và trả về View/JSON.
- **Service:** Chứa 100% logic nghiệp vụ và thao tác Database (Sạch sẽ & Dễ test).FF
- **Models:** Sử dụng **Sequelize ORM** để định nghĩa cấu trúc bảng và mối quan hệ.
- **Real-time:** **Socket.io** xử lý việc truyền tải tin nhắn tức thời.
- **AI:** Tích hợp **Google Gemini** để hỗ trợ gợi ý phản hồi.

---

## 2. HƯỚNG DẪN CÀI ĐẶT (SETUP)

### Bước 1: Chuẩn bị Database

1. Tạo một database mới trong MySQL (ví dụ: `intern_chat_core`).
2. Không cần tạo bảng thủ công, Sequelize sẽ tự động làm việc này khi bạn chạy server.

### Bước 2: Cấu hình môi trường

1. Copy file `.env.example` (nếu có) hoặc tạo file `.env` mới trong thư mục gốc.
2. Điền thông tin kết nối DB và API Key của Gemini:

   ```env
   DB_NAME=intern_chat_core
   DB_USER=root
   DB_PASS=your_password
   GEMINI_API_KEY=AIzaSy...
   ```

### Bước 3: Cài đặt Dependencies

```bash
npm install
```

### Bước 4: Chạy dự án

```bash
# Môi trường phát triển (có hot-reload)
npm run dev

# Chạy production
npm run build
npm start
```

---

## 3. CÁC TÍNH NĂNG CHÍNH (KEY FEATURES)

1. **Xác thực người dùng:** Đăng ký, Đăng nhập, Quản lý Session.
2. **Chat 1-1:** Tìm người dùng và bắt đầu trò chuyện riêng tư.
3. **Chat Nhóm:** Tạo nhóm, đặt tên và thêm nhiều thành viên cùng lúc.
4. **Real-time:** Nhận tin nhắn mới ngay lập tức mà không cần F5 trang.
5. **AI Gợi ý:** Bấm vào biểu tượng Robot cạnh ô chat để nhận gợi ý phản hồi thông minh từ Gemini.

---

## 4. CẤU TRÚC THƯ MỤC (PROJECT STRUCTURE)

```text
chat-core/
├── config/         # Cấu hình Database & App
├── controllers/    # Xử lý Request/Response
├── models/         # Định nghĩa Sequelize Models
├── routes/         # Định nghĩa đường dẫn URL
├── services/       # LOGIC NGHIỆP VỤ (Quan trọng nhất)
├── src/            # Mã nguồn Frontend (SCSS, JS)
├── views/          # Giao diện HTML (EJS templates)
├── public/         # Tĩnh (CSS/JS đã compile)
└── server.js       # File khởi động chính
```

---

## 5. LỜI KHUYÊN

Chào mừng bạn đến với dự án Core Chat! Dưới đây là một số lời khuyên để bạn bắt đầu:

- Đọc kỹ file `DEVELOPMENT_PLAN.md` để hiểu rõ từng giai đoạn phát triển.
- Bắt đầu từ việc đọc và hiểu các file trong thư mục `models/` để nắm rõ cấu trúc dữ liệu.
- Hãy đọc kỹ các file trong thư mục `services/` để hiểu cách xử lý nghiệp vụ.
- Sử dụng Postman hoặc công cụ tương tự để test API khi cần.
- Thử thêm tính năng mới (ví dụ: "Xóa tin nhắn" hoặc "Thả cảm xúc") để luyện tập.
- Chúc bạn học tốt! 🎉
