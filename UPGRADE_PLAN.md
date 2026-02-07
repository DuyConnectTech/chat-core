# UPGRADE PLAN: CHAT CORE V2.0 🚀

Tài liệu này phác thảo lộ trình nâng cấp toàn diện cho dự án `chat-core`, biến nó từ một ứng dụng chat cơ bản thành một hệ thống mạnh mẽ, giàu tính năng và sẵn sàng cho production.

---

## 1. MỤC TIÊU (OBJECTIVES)
1.  **Tính năng nâng cao:** Chat đa phương tiện (Ảnh, Audio), Quản lý tin nhắn (Thu hồi, Xóa), Quản lý nhóm (Rời, Xóa).
2.  **AI Integration:** Biến AI thành một "thành viên" trong nhóm chat (Bot Mode) thay vì chỉ gợi ý.
3.  **Hiệu năng:** Tối ưu hóa tải trang, lazy loading, sử dụng Redis cho Socket.
4.  **Chất lượng:** Viết Test (Unit/Integration) để đảm bảo độ ổn định.

---

## 2. CẬP NHẬT DATABASE SCHEMA (SEQUELIZE)

### 2.1. Bảng `Messages` (Update)
- Thêm cột `is_recalled` (BOOLEAN): Đánh dấu tin nhắn đã bị thu hồi.
- Thêm cột `metadata` (JSON): Lưu thông tin file ảnh/audio (url, size, duration).
- Thêm cột `deleted_for` (JSON): Mảng chứa ID user đã xóa tin nhắn này phía họ (Local delete).

### 2.2. Bảng `Conversations` (Update)
- Thêm cột `is_bot_active` (BOOLEAN): Bật/Tắt AI Bot trong cuộc hội thoại này.
- Thêm cột `owner_id` (UUID): Xác định chủ phòng (cho nhóm).

### 2.3. Bảng `Attachments` (New - Optional)
*(Nếu muốn quản lý file chặt chẽ hơn)*
- `id`, `message_id`, `file_url`, `file_type`, `file_size`.

---

## 3. THIẾT KẾ API & SOCKET EVENTS

### 3.1. RESTful API Endpoints
| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| **POST** | `/api/upload` | Upload hình ảnh/audio (dùng Multer). |
| **POST** | `/api/groups/:id/leave` | Rời khỏi nhóm. |
| **DELETE** | `/api/groups/:id` | Giải tán nhóm (Chỉ Owner). |
| **PUT** | `/api/conversations/:id/bot` | Bật/Tắt Bot AI. |
| **DELETE** | `/api/messages/:id` | Xóa tin nhắn (phía mình hoặc thu hồi). |

### 3.2. Socket Events (New)
- `message:recall`: Server báo cho client biết tin nhắn ID `X` đã bị thu hồi.
- `group:member_left`: Thông báo thành viên rời nhóm.
- `group:deleted`: Thông báo nhóm bị giải tán -> Client chuyển hướng về trang chủ.
- `bot:typing`: Giả lập hành động Bot đang gõ.

---

## 4. LỘ TRÌNH PHÁT TRIỂN (PHASES)

### Giai đoạn 1: Nâng cấp Cơ sở dữ liệu & Helper (Foundation)
- [ ] Cập nhật Models (`Message`, `Conversation`).
- [ ] Chạy Migration (`sequelize.sync({ alter: true })`).
- [ ] Cấu hình `Multer` trong `utils/upload.js` để xử lý upload file.

### Giai đoạn 2: Tính năng Đa phương tiện (Multimedia)
- [ ] **Backend:** API Upload ảnh/audio.
- [ ] **Frontend:**
    - UI nút kẹp ghim (Attachment).
    - Preview ảnh trước khi gửi.
    - Tích hợp `MediaRecorder API` để ghi âm trực tiếp trên trình duyệt.
    - Audio Player custom (hoặc dùng thẻ `<audio>` cơ bản).

### Giai đoạn 3: Quản lý Tin nhắn & Nhóm
- [ ] **Thu hồi tin nhắn:** Chỉ người gửi mới được thu hồi (trong vòng X phút).
- [ ] **Xóa tin nhắn phía mình:** Chỉ ẩn tin nhắn đó khỏi view của user hiện tại.
- [ ] **Rời nhóm:** Logic xóa `ConversationMember`. Nếu Admin rời, chuyển quyền cho người khác.
- [ ] **Xóa nhóm:** Xóa toàn bộ dữ liệu liên quan (Soft delete).

### Giai đoạn 4: AI Chatbot (The Bot Member)
- [ ] Tạo một User đặc biệt trong DB (Role: `bot`).
- [ ] Khi `is_bot_active = true`:
    - Bot tự động lắng nghe tin nhắn mới trong phòng.
    - Gửi ngữ cảnh cho Gemini.
    - Socket emit `bot:typing`.
    - Gửi phản hồi vào chat như một user bình thường.

### Giai đoạn 5: Tối ưu hóa & Hiệu năng
- [ ] **Lazy Loading:** Chỉ tải 20 tin nhắn đầu, cuộn lên tải tiếp.
- [ ] **Image Optimization:** Dùng thư viện `sharp` để resize ảnh trước khi lưu.
- [ ] **Redis Adapter:** Cấu hình Socket.io dùng Redis (chuẩn bị cho Scale nhiều server).

### Giai đoạn 6: Testing (Quality Assurance)
- [ ] **Unit Test:** Dùng `Jest` hoặc `Mocha` test các Service (`auth.service`, `chat.service`).
- [ ] **Integration Test:** Test các API Endpoints bằng `Supertest`.

---

## 5. UI/UX REQUIREMENTS
- **Multimedia:** Ảnh hiển thị dạng grid đẹp mắt, Audio có sóng nhạc (waveform) nếu có thể.
- **Actions:** Menu chuột phải (hoặc long-press trên mobile) vào tin nhắn để hiện tùy chọn: *Thu hồi, Xóa, Copy*.
- **Feedback:** Hiệu ứng loading mượt mà khi gửi ảnh/audio.

---
*Kế hoạch này được thiết kế để thực hiện cuốn chiếu (Rolling wave), xong phase nào chắc phase đó.*
