# CORE CHAT PROJECT - DEVELOPMENT PLAN & ARCHITECTURE

Tài liệu này định nghĩa cấu trúc, kế hoạch triển khai và theo dõi tiến độ cho dự án **Chat Core** (Phiên bản rút gọn dành cho Intern).

---

## 1. KIẾN TRÚC HỆ THỐNG (ARCHITECTURE)

Dự án tuân thủ mô hình **MVC (Model-View-Controller)** kết hợp với **Service Layer** để tách biệt nghiệp vụ.

- **Backend:** Node.js (v18+) sử dụng chuẩn **ES Modules (ESM)**.
- **Framework:** Express.js.
- **ORM:** Sequelize (MySQL).
- **Real-time:** Socket.io (Namespace: `/`).
- **View Engine:** EJS (Server-side Rendering).
- **CSS Preprocessor:** SCSS (Sass).
- **Bundler:** ESBuild (Cho Frontend JavaScript).
- **Auth:** Session-based (Web) & JWT-based (API/Socket).

### Quy tắc triển khai:
1. **Model:** Định nghĩa cấu trúc bảng và mối quan hệ (Associations) bằng Sequelize.
2. **Controller:** Chỉ tiếp nhận Request, gọi Service và trả về Response.
3. **Service:** Chứa logic nghiệp vụ, sử dụng Sequelize Model để thao tác dữ liệu.
4. **Socket Service:** Quản lý tập trung các sự kiện Real-time.

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Schema được thiết kế theo hướng **Universal User** (Giống Messenger/Zalo) để hỗ trợ cả Chat 1-1 và Group Chat linh hoạt.

| Bảng | Chức năng | Ghi chú |
| :--- | :--- | :--- |
| `users` | Lưu thông tin người dùng | `role` gồm `admin` và `user`. |
| `conversations` | Lưu phòng chat (Private/Group) | `type` định nghĩa loại phòng. |
| `conversation_members` | Quản lý thành viên phòng | Lưu vai trò của user trong nhóm (Owner/Member). |
| `messages` | Lưu nội dung tin nhắn | Hỗ trợ text, image, system, ai. |
| `settings` | Cấu hình hệ thống | Lưu API Key Gemini, tên ứng dụng, v.v. |

---

## 3. DANH SÁCH NHIỆM VỤ (TASK LIST)

### Giai đoạn 1: Khởi tạo & Cấu hình (Core Setup)
- [x] **Task 1.1:** Khởi tạo `package.json` và cài đặt dependencies.
- [x] **Task 1.2:** Thiết lập cấu trúc thư mục tiêu chuẩn.
- [x] **Task 1.3:** Cấu hình Database Pool và file `.env`.
- [x] **Task 1.4:** Thiết lập Server Entry Point (`app.js`) và Middleware cơ bản (Helmet, CORS, Session).

### Giai đoạn 2: Tính năng Xác thực & Người dùng (Auth)
- [x] **Task 2.0:** Định nghĩa Sequelize Models & Associations.
- [x] **Task 2.1:** Viết `auth.service.js` (Register, Login với Bcrypt).
- [x] **Task 2.2:** Viết Giao diện Đăng nhập/Đăng ký (EJS + SCSS).
- [ ] **Task 2.3:** Middleware kiểm tra quyền truy cập (Auth Guard).

### Giai đoạn 3: Tính năng Chat Real-time (Core Chat)
- [x] **Task 3.1:** Viết `chat.service.js` (Tạo conversation, lưu message).
- [x] **Task 3.2:** Tích hợp Socket.io (Handle connection, join room, send message).
- [x] **Task 3.3:** Xây dựng giao diện Chat chính (Sidebar list, Chat Window).
- [x] **Task 3.4:** Xử lý Trạng thái Online/Offline.

### Giai đoạn 4: Quản lý Group Chat
- [x] **Task 4.1:** Logic tạo nhóm và thêm/xóa thành viên.
- [x] **Task 4.2:** Tin nhắn hệ thống (Ví dụ: "Admin đã thêm bạn vào nhóm").
- [x] **Task 4.3:** Giao diện quản lý thông tin nhóm.

### Giai đoạn 5: Tích hợp Gemini AI
- [x] **Task 5.1:** Viết `gemini.service.js` kết nối Google Generative AI SDK.
- [x] **Task 5.2:** Tính năng "Gợi ý trả lời" (Admin bấm nút để AI tạo nháp).
- [ ] **Task 5.3:** Cấu hình tham số AI qua Dashboard/Setting.

### Giai đoạn 6: Quản trị & Hoàn thiện
- [ ] **Task 6.1:** Trang Dashboard Admin (Quản lý User, Rooms).
- [/] **Task 6.2:** Tối ưu hóa Build Script (ESBuild + Sass).
- [/] **Task 6.3:** Viết README.md hướng dẫn chi tiết cho Intern.

---

## 4. BẢNG THEO DÕI TIẾN ĐỘ (PROGRESS TRACKER)

| Nhiệm vụ | Trạng thái | Ngày hoàn thành | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Giai đoạn 1** | ✅ Hoàn thành | 07/02/2026 | Khởi tạo cấu trúc xong. |
| **Giai đoạn 2** | ✅ Hoàn thành | 07/02/2026 | Models & Auth xong. |
| **Giai đoạn 3** | ✅ Hoàn thành | 07/02/2026 | Lõi Chat Real-time xong. |
| **Giai đoạn 4** | ✅ Hoàn thành | 07/02/2026 | Phát triển Group Chat xong. |
| **Giai đoạn 5** | ✅ Hoàn thành | 07/02/2026 | Tích hợp Gemini AI xong. |
| **Giai đoạn 6** | 🔄 Đang chạy | - | Hoàn thiện tài liệu & Build. |

---
*Ghi chú: Luôn cập nhật trạng thái vào bảng này sau mỗi Task hoàn thành.*
